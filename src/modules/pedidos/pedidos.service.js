import { ORDEM_STATUS, STATUS_PEDIDO } from '../../config/constantes.js'
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
    consulta.criadoEm = { $gte: inicioDoDia() }
  }

  return Pedido.find(consulta).sort({ criadoEm: -1 }).limit(LIMITE_LISTA)
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

  // Fora o cancelamento, o status só avança — nunca volta.
  if (novoStatus !== STATUS_PEDIDO.CANCELADO) {
    const atual = ORDEM_STATUS.indexOf(pedido.status)
    const novo = ORDEM_STATUS.indexOf(novoStatus)

    if (novo <= atual) {
      throw new ApiError(400, 'O status do pedido só avança na ordem do atendimento')
    }
  }

  pedido.status = novoStatus
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
