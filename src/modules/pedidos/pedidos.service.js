import mongoose from 'mongoose'
import { ORDEM_STATUS, STATUS_EM_ABERTO, STATUS_PEDIDO } from '../../config/constantes.js'
import { ApiError } from '../../lib/ApiError.js'
import { pedidoPublico } from '../../lib/pedidoPublico.js'
import { emitirParaLoja, emitirParaPedido } from '../../lib/socket.js'
import { Pedido } from '../../models/Pedido.js'

const LIMITE_LISTA = 200

// Pedido que já terminou pode sair da operação (arquivar/remover).
// Pedido em andamento não: se sumir da fila, ninguém entrega.
const STATUS_FINALIZADOS = [STATUS_PEDIDO.ENTREGUE, STATUS_PEDIDO.CANCELADO]

function inicioDoDia() {
  const inicio = new Date()
  inicio.setHours(0, 0, 0, 0)
  return inicio
}

// Em que "marco" do pedido cada status entra. Cancelado não tem marco: não é
// uma etapa do atendimento.
const MARCO_DO_STATUS = {
  [STATUS_PEDIDO.ACEITO]: 'aceitoEm',
  [STATUS_PEDIDO.PREPARANDO]: 'preparandoEm',
  [STATUS_PEDIDO.PRONTO]: 'prontoEm',
  [STATUS_PEDIDO.SAIU_ENTREGA]: 'saiuEm',
  [STATUS_PEDIDO.ENTREGUE]: 'entregueEm',
}

function marcoDoStatus(status) {
  return MARCO_DO_STATUS[status] || null
}

/*
 * Voltar uma etapa apaga os marcos das etapas que deixaram de existir.
 *
 * Sem isso o pedido voltaria com "prontoEm" de 20:40 e "saiuEm" de 20:52
 * gravados: o contador da etapa nova mostraria horas que não aconteceram e o
 * resumo de tempos viraria ficção.
 */
function limparMarcosDepoisDe(pedido, statusDestino) {
  const destino = ORDEM_STATUS.indexOf(statusDestino)

  for (const status of ORDEM_STATUS) {
    if (ORDEM_STATUS.indexOf(status) <= destino) continue

    const marco = marcoDoStatus(status)
    if (marco) pedido.marcos[marco] = undefined
  }
}

function ehVerdadeiro(valor) {
  return valor === true || valor === '1' || valor === 'true'
}

export async function listarPedidos(lojaId, filtros = {}) {
  const consulta = { lojaId }

  // Arquivado é histórico: só volta para a tela quando ela pede.
  // $ne: true também pega os pedidos antigos, que não têm o campo.
  consulta.arquivado = ehVerdadeiro(filtros.arquivados) ? true : { $ne: true }

  if (filtros.status) {
    if (!Object.values(STATUS_PEDIDO).includes(filtros.status)) {
      throw new ApiError(400, 'Status inválido')
    }

    consulta.status = filtros.status
  }

  if (ehVerdadeiro(filtros.hoje)) {
    // Pedido em aberto é sempre do "agora". Sem isso, pedido que ficou de
    // ontem conta no resumo mas some do quadro — e some pra sempre.
    consulta.$or = [
      { criadoEm: { $gte: inicioDoDia() } },
      { status: { $in: STATUS_EM_ABERTO } },
    ]
  }

  // Fila: mais antigo primeiro, porque quem chegou antes é prioridade.
  // Histórico (arquivados) é o contrário — ali o que interessa é o mais recente.
  const ordem = ehVerdadeiro(filtros.arquivados) ? -1 : 1

  return Pedido.find(consulta).sort({ criadoEm: ordem }).limit(LIMITE_LISTA)
}

export async function buscarPedido(lojaId, id) {
  const pedido = await Pedido.findOne({ _id: id, lojaId })

  if (!pedido) {
    throw new ApiError(404, 'Pedido não encontrado')
  }

  return pedido
}

export async function mudarStatus(lojaId, id, novoStatus) {
  if (!Object.values(STATUS_PEDIDO).includes(novoStatus)) {
    throw new ApiError(400, 'Status inválido')
  }

  const pedido = await buscarPedido(lojaId, id)

  if (pedido.status === STATUS_PEDIDO.CANCELADO) {
    throw new ApiError(400, 'Este pedido já foi cancelado')
  }

  if (pedido.status === STATUS_PEDIDO.ENTREGUE) {
    throw new ApiError(400, 'Este pedido já foi entregue')
  }

  if (novoStatus === pedido.status) {
    return pedido
  }

  // Cancelar é sempre permitido (menos em pedido já finalizado, tratado acima).
  // Fora isso, o status anda para frente e também pode voltar: quem atende às
  // vezes clica cedo demais e precisa corrigir.
  if (novoStatus !== STATUS_PEDIDO.CANCELADO) {
    const atual = ORDEM_STATUS.indexOf(pedido.status)
    const novo = ORDEM_STATUS.indexOf(novoStatus)

    if (novo < atual) limparMarcosDepoisDe(pedido, novoStatus)
  }

  pedido.status = novoStatus

  const marco = marcoDoStatus(novoStatus)
  if (marco) pedido.marcos[marco] = new Date()

  await pedido.save()

  // Painel de todas as abas da loja + tela de acompanhamento do cliente.
  // Para o cliente vai a versão pública: sem lojaId, sem produtoId.
  emitirParaLoja(lojaId, 'pedido:atualizado', { pedido })
  emitirParaPedido(pedido._id, 'pedido:status', { pedido: pedidoPublico(pedido) })

  return pedido
}

/**
 * Arquivar tira o pedido do quadro sem apagar nada.
 * Só vale para pedido que já terminou — pedido em andamento some da fila e
 * ninguém entrega.
 */
export async function arquivarPedido(lojaId, id, arquivado) {
  const pedido = await buscarPedido(lojaId, id)
  const valor = Boolean(arquivado)

  if (pedido.arquivado === valor) {
    return pedido
  }

  if (valor && !STATUS_FINALIZADOS.includes(pedido.status)) {
    throw new ApiError(400, 'Só dá para arquivar pedido entregue ou cancelado')
  }

  pedido.arquivado = valor
  await pedido.save()

  emitirParaLoja(lojaId, 'pedido:atualizado', { pedido })

  return pedido
}

/**
 * Remover apaga de verdade e não volta. Fica separado do arquivar de propósito:
 * é faxina de pedido cancelado, não rotina do dia.
 */
export async function removerPedido(lojaId, id) {
  const pedido = await buscarPedido(lojaId, id)

  if (pedido.status !== STATUS_PEDIDO.CANCELADO) {
    throw new ApiError(
      400,
      'Só dá para remover pedido cancelado. Para os outros, use arquivar.',
    )
  }

  await pedido.deleteOne()

  emitirParaLoja(lojaId, 'pedido:removido', { id: String(pedido._id) })
  // A tela do cliente fica aberta esperando: se o pedido foi apagado, ela
  // precisa saber, senão mostra um pedido que não existe mais.
  emitirParaPedido(pedido._id, 'pedido:removido', { id: String(pedido._id) })
}

export async function resumoPedidos(lojaId) {
  const emAndamento = [
    STATUS_PEDIDO.ACEITO,
    STATUS_PEDIDO.PREPARANDO,
    STATUS_PEDIDO.PRONTO,
    STATUS_PEDIDO.SAIU_ENTREGA,
  ]

  const desde = inicioDoDia()

  const [novos, andamento, entreguesHoje, faturamento] = await Promise.all([
    Pedido.countDocuments({ lojaId, status: STATUS_PEDIDO.NOVO }),
    Pedido.countDocuments({ lojaId, status: { $in: emAndamento } }),
    Pedido.countDocuments({
      lojaId,
      status: STATUS_PEDIDO.ENTREGUE,
      criadoEm: { $gte: desde },
    }),
    Pedido.aggregate([
      {
        $match: {
          lojaId,
          status: STATUS_PEDIDO.ENTREGUE,
          criadoEm: { $gte: desde },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ])

  return {
    novos,
    emAndamento: andamento,
    entreguesHoje,
    // Soma em centavos, como todo valor do sistema.
    faturamentoHoje: faturamento[0]?.total || 0,
  }
}

// ---------- Estatísticas (gráfico de vendas do painel) ----------

// O servidor roda em UTC na Vercel: agrupar por dia sem fuso jogaria a venda
// da noite para o dia seguinte.
const FUSO = 'America/Sao_Paulo'
const PERIODOS = [7, 30]

function diasDoPeriodo(quantidade) {
  const dias = []
  const agora = Date.now()

  for (let atras = quantidade - 1; atras >= 0; atras -= 1) {
    const dia = new Date(agora - atras * 24 * 60 * 60 * 1000)

    dias.push({
      // AAAA-MM-DD no fuso da loja: é a chave que casa com a agregação.
      data: dia.toLocaleDateString('sv-SE', { timeZone: FUSO }),
      rotulo: dia.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        timeZone: FUSO,
      }),
      diaSemana: dia
        .toLocaleDateString('pt-BR', { weekday: 'short', timeZone: FUSO })
        .replace('.', ''),
    })
  }

  return dias
}

/**
 * Vendas por dia, para o gráfico do painel.
 *
 * Uma única agregação por período: o banco agrupa, o front só desenha. O
 * índice { lojaId, status, criadoEm } cobre o filtro.
 */
export async function estatisticasPedidos(lojaId, periodo) {
  const quantidade = Number(periodo) || 7

  if (!PERIODOS.includes(quantidade)) {
    throw new ApiError(400, 'Período inválido. Use 7 ou 30 dias.')
  }

  const dias = diasDoPeriodo(quantidade)
  // Brasil não tem mais horário de verão: deslocamento fixo.
  const inicio = new Date(`${dias[0].data}T00:00:00-03:00`)

  const linhas = await Pedido.aggregate([
    {
      $match: {
        // Aggregate não converte string em ObjectId: converter na mão.
        lojaId: new mongoose.Types.ObjectId(String(lojaId)),
        status: STATUS_PEDIDO.ENTREGUE,
        criadoEm: { $gte: inicio },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$criadoEm', timezone: FUSO } },
        pedidos: { $sum: 1 },
        faturamento: { $sum: '$total' },
      },
    },
  ])

  const porDia = new Map(linhas.map((linha) => [linha._id, linha]))

  // Dia sem venda precisa aparecer no gráfico como zero, não sumir.
  const serie = dias.map((dia) => ({
    ...dia,
    pedidos: porDia.get(dia.data)?.pedidos || 0,
    faturamento: porDia.get(dia.data)?.faturamento || 0,
  }))

  return {
    dias: quantidade,
    serie,
    totalPedidos: serie.reduce((soma, dia) => soma + dia.pedidos, 0),
    totalFaturamento: serie.reduce((soma, dia) => soma + dia.faturamento, 0),
  }
}
