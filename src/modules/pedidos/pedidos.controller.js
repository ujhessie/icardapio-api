import {
  arquivarPedido,
  buscarPedido,
  listarPedidos,
  mudarStatus,
  removerPedido,
  resumoPedidos,
} from './pedidos.service.js'

export async function listar(req, res) {
  const pedidos = await listarPedidos(req.usuario.lojaId, {
    status: req.query.status,
    hoje: req.query.hoje,
    arquivados: req.query.arquivados,
  })
  res.json({ pedidos })
}

export async function detalhar(req, res) {
  res.json({ pedido: await buscarPedido(req.usuario.lojaId, req.params.id) })
}

export async function atualizarStatus(req, res) {
  const pedido = await mudarStatus(req.usuario.lojaId, req.params.id, req.body?.status)
  res.json({ pedido })
}

export async function resumo(req, res) {
  res.json({ resumo: await resumoPedidos(req.usuario.lojaId) })
}

export async function arquivar(req, res) {
  const pedido = await arquivarPedido(req.usuario.lojaId, req.params.id, req.body?.arquivado)
  res.json({ pedido })
}

export async function remover(req, res) {
  await removerPedido(req.usuario.lojaId, req.params.id)
  res.status(204).end()
}
