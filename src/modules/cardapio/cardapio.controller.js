import {
  atualizarCategoria,
  atualizarProduto,
  criarCategoria,
  criarProduto,
  listarCategorias,
  listarProdutos,
  removerCategoria,
  removerProduto,
} from './cardapio.service.js'

export async function listarCategoriasController(req, res) {
  res.json({ categorias: await listarCategorias(req.usuario.lojaId) })
}

export async function criarCategoriaController(req, res) {
  res.status(201).json({ categoria: await criarCategoria(req.usuario.lojaId, req.body) })
}

export async function atualizarCategoriaController(req, res) {
  res.json({ categoria: await atualizarCategoria(req.usuario.lojaId, req.params.id, req.body) })
}

export async function removerCategoriaController(req, res) {
  await removerCategoria(req.usuario.lojaId, req.params.id)
  res.status(204).end()
}

export async function listarProdutosController(req, res) {
  res.json({
    produtos: await listarProdutos(req.usuario.lojaId, { categoriaId: req.query.categoriaId }),
  })
}

export async function criarProdutoController(req, res) {
  res.status(201).json({ produto: await criarProduto(req.usuario.lojaId, req.body) })
}

export async function atualizarProdutoController(req, res) {
  res.json({ produto: await atualizarProduto(req.usuario.lojaId, req.params.id, req.body) })
}

export async function removerProdutoController(req, res) {
  await removerProduto(req.usuario.lojaId, req.params.id)
  res.status(204).end()
}
