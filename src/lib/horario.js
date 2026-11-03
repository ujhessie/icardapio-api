import { ApiError } from './ApiError.js'

/*
 * Horário de funcionamento: uma regra só, usada em dois lugares.
 *
 * 1. O cardápio público informa se a loja está aberta agora.
 * 2. criarPedido recusa pedido fora do horário.
 *
 * A regra tem que ser a mesma nos dois, senão a tela diz "aberto" e o pedido
 * volta com erro. Por isso mora aqui, não duplicada.
 *
 * O interruptor `aberta` é a última palavra: ele é a pausa de emergência do
 * dono. Se estiver desligado, nenhum horário abre a loja.
 */

const NOMES_DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/
const DATA_VALIDA = /^\d{4}-\d{2}-\d{2}$/

const LIMITE_DATAS_ESPECIAIS = 100

function minutosDe(hora) {
  const [h, m] = String(hora || '00:00').split(':')
  return Number(h) * 60 + Number(m)
}

// 18:00 → "18h" | 22:30 → "22h30" | 00:00 → "meia-noite" | 02:00 → "2h"
function horaCurta(hora) {
  const [h, m] = String(hora || '00:00').split(':')
  const minutos = Number(m)

  if (Number(h) === 0 && minutos === 0) return 'meia-noite'

  return minutos === 0 ? `${Number(h)}h` : `${Number(h)}h${String(m).padStart(2, '0')}`
}

function dataLocalISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

// Janela do dia, aceitando fechamento depois da meia-noite (18:00 → 02:00).
function dentroDaJanela(abre, fecha, minutos) {
  if (fecha > abre) return minutos >= abre && minutos < fecha
  return minutos >= abre || minutos < fecha
}

function proximaAbertura(horarios, diaHoje) {
  for (let passo = 1; passo <= 7; passo += 1) {
    const dia = horarios.find((item) => item.dia === (diaHoje + passo) % 7)

    if (!dia?.aberto) continue

    const quando = passo === 1 ? 'amanhã' : NOMES_DIAS[dia.dia]
    return `Fechado · abre ${quando} às ${horaCurta(dia.abre)}`
  }

  return 'Fechado · nenhum dia aberto'
}

/**
 * Status da loja no instante informado.
 * Devolve `aberto` (o que o pedido respeita) e `texto` (o que o cliente lê).
 */
export function statusDaLoja(loja, agora = new Date()) {
  if (loja?.aberta === false) {
    return { aberto: false, texto: 'Fechado no momento' }
  }

  const horarios = loja?.horarios || []
  const especiais = loja?.datasEspeciais || []

  // Loja sem grade: o interruptor é a única regra.
  if (horarios.length === 0) {
    return { aberto: true, texto: 'Aberto agora' }
  }

  const minutos = agora.getHours() * 60 + agora.getMinutes()
  const diaHoje = agora.getDay()
  const hoje = dataLocalISO(agora)
  const especial = especiais.find((item) => item.data === hoje)

  if (especial) {
    if (especial.fechado) {
      return {
        aberto: false,
        texto: `Fechado hoje · ${especial.motivo || 'data especial'}`,
      }
    }

    const abre = minutosDe(especial.abre)
    const fecha = minutosDe(especial.fecha)

    if (dentroDaJanela(abre, fecha, minutos)) {
      return { aberto: true, texto: `Aberto agora · fecha às ${horaCurta(especial.fecha)}` }
    }

    if (minutos < abre) {
      return { aberto: false, texto: `Fechado · abre hoje às ${horaCurta(especial.abre)}` }
    }

    return {
      aberto: false,
      texto: `Fechado · hoje das ${horaCurta(especial.abre)} às ${horaCurta(especial.fecha)}`,
    }
  }

  const hojeHorario = horarios.find((item) => item.dia === diaHoje)

  if (hojeHorario?.aberto) {
    const abre = minutosDe(hojeHorario.abre)
    const fecha = minutosDe(hojeHorario.fecha)

    if (dentroDaJanela(abre, fecha, minutos)) {
      return { aberto: true, texto: `Aberto agora · fecha às ${horaCurta(hojeHorario.fecha)}` }
    }

    if (minutos < abre) {
      return { aberto: false, texto: `Fechado · abre hoje às ${horaCurta(hojeHorario.abre)}` }
    }
  }

  // Plantão que começou ontem e atravessou a meia-noite (ex: 18h → 2h).
  const ontemHorario = horarios.find((item) => item.dia === (diaHoje + 6) % 7)

  if (ontemHorario?.aberto) {
    const abre = minutosDe(ontemHorario.abre)
    const fecha = minutosDe(ontemHorario.fecha)

    if (fecha <= abre && minutos < fecha) {
      return { aberto: true, texto: `Aberto agora · fecha às ${horaCurta(ontemHorario.fecha)}` }
    }
  }

  return { aberto: false, texto: proximaAbertura(horarios, diaHoje) }
}

/** Limpa e valida a grade antes de gravar. Lança 400 se vier coisa estranha. */
export function normalizarHorarios(valor) {
  if (valor === undefined) return undefined
  if (!Array.isArray(valor)) throw new ApiError(400, 'Horários inválidos')

  const vistos = new Set()
  const limpos = []

  for (const item of valor) {
    const dia = Number(item?.dia)

    if (!Number.isInteger(dia) || dia < 0 || dia > 6) {
      throw new ApiError(400, 'Dia da semana inválido')
    }

    if (vistos.has(dia)) continue
    vistos.add(dia)

    const abre = String(item?.abre ?? '18:00').trim()
    const fecha = String(item?.fecha ?? '23:00').trim()

    if (!HORA_VALIDA.test(abre) || !HORA_VALIDA.test(fecha)) {
      throw new ApiError(400, 'Horário inválido. Use o formato HH:MM')
    }

    limpos.push({ dia, aberto: Boolean(item?.aberto), abre, fecha })
  }

  return limpos.sort((a, b) => a.dia - b.dia)
}

/** Limpa e valida as datas especiais (feriados, vésperas, eventos). */
export function normalizarDatasEspeciais(valor) {
  if (valor === undefined) return undefined
  if (!Array.isArray(valor)) throw new ApiError(400, 'Datas especiais inválidas')

  if (valor.length > LIMITE_DATAS_ESPECIAIS) {
    throw new ApiError(400, `Máximo de ${LIMITE_DATAS_ESPECIAIS} datas especiais`)
  }

  const vistos = new Set()
  const limpos = []

  for (const item of valor) {
    const data = String(item?.data || '').trim()

    if (!DATA_VALIDA.test(data)) {
      throw new ApiError(400, 'Data inválida. Use o formato AAAA-MM-DD')
    }

    if (vistos.has(data)) continue
    vistos.add(data)

    const fechado = item?.fechado !== false
    const abre = fechado ? '' : String(item?.abre || '').trim()
    const fecha = fechado ? '' : String(item?.fecha || '').trim()

    if (!fechado && (!HORA_VALIDA.test(abre) || !HORA_VALIDA.test(fecha))) {
      throw new ApiError(400, 'Data especial aberta precisa de horário de abertura e fechamento')
    }

    limpos.push({
      data,
      motivo: String(item?.motivo || '').trim().slice(0, 60),
      fechado,
      abre,
      fecha,
    })
  }

  return limpos.sort((a, b) => a.data.localeCompare(b.data))
}
