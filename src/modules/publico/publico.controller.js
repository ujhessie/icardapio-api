import {
  buscarPedidoPublico,
  criarPedido,
  montarCardapio,
} from './publico.service.js'

export async function cardapio(req, res) {
  res.json(await montarCardapio(req.params.slug))
}

export async function criar(req, res) {
  res.status(201).json({ pedido: await criarPedido(req.params.slug, req.body) })
}

export async function detalharPedido(req, res) {
  res.json({ pedido: await buscarPedidoPublico(req.params.slug, req.params.id) })
}
