import { ApiError } from '../../lib/ApiError.js'
import { Categoria } from '../../models/Categoria.js'
import { Produto } from '../../models/Produto.js'

function validarNome(valor, entidade) {
  if (!valor || !String(valor).trim()) {
    throw new ApiError(400, `Informe o nome da ${entidade}`)
  }

  return String(valor).trim()
}

function validarCentavos(valor, campo) {
  const numero = Number(valor)

  if (!Number.isInteger(numero) || numero < 0) {
    throw new ApiError(400, `${campo} inválido. Envie o valor em centavos.`)
  }

  return numero
}

async function buscarCategoriaDaLoja(lojaId, categoriaId) {
  const categoria = await Categoria.findOne({ _id: categoriaId, lojaId })

  if (!categoria) {
    throw new ApiError(404, 'Categoria não encontrada nesta loja')
  }

  return categoria
}

/* ---------------- Categorias ---------------- */

export async function listarCategorias(lojaId) {
  return Categoria.find({ lojaId }).sort({ ordem: 1, nome: 1 })
}

export async function criarCategoria(lojaId, dados) {
  const nome = validarNome(dados.nome, 'categoria')
  const ultima = await Categoria.findOne({ lojaId }).sort({ ordem: -1 })
  const ordem = Number.isFinite(Number(dados.ordem)) ? Number(dados.ordem) : (ultima?.ordem ?? 0) + 1

  return Categoria.create({ lojaId, nome, ordem })
}

export async function atualizarCategoria(lojaId, id, dados) {
  const categoria = await Categoria.findOne({ _id: id, lojaId })

  if (!categoria) {
    throw new ApiError(404, 'Categoria não encontrada')
  }

  if (dados.nome !== undefined) categoria.nome = validarNome(dados.nome, 'categoria')
  if (dados.ordem !== undefined) categoria.ordem = Number(dados.ordem) || 0
  if (dados.ativa !== undefined) categoria.ativa = Boolean(dados.ativa)

  await categoria.save()
  return categoria
}

export async function removerCategoria(lojaId, id) {
  const categoria = await Categoria.findOne({ _id: id, lojaId })

  if (!categoria) {
    throw new ApiError(404, 'Categoria não encontrada')
  }

  const produtos = await Produto.countDocuments({ lojaId, categoriaId: id })

  if (produtos > 0) {
    throw new ApiError(
      400,
      `Essa categoria tem ${produtos} produto(s). Mova ou apague antes de remover.`,
    )
  }

  await categoria.deleteOne()
}

/* ---------------- Produtos ---------------- */

export async function listarProdutos(lojaId, { categoriaId } = {}) {
  const consulta = { lojaId }

  if (categoriaId) {
    consulta.categoriaId = categoriaId
  }

  return Produto.find(consulta).sort({ ordem: 1, nome: 1 })
}

export async function criarProduto(lojaId, dados) {
  const nome = validarNome(dados.nome, 'produto')
  const preco = validarCentavos(dados.preco, 'Preço')

  await buscarCategoriaDaLoja(lojaId, dados.categoriaId)

  const ultimo = await Produto.findOne({ lojaId, categoriaId: dados.categoriaId }).sort({
    ordem: -1,
  })

  return Produto.create({
    lojaId,
    categoriaId: dados.categoriaId,
    nome,
    descricao: dados.descricao ? String(dados.descricao).trim() : '',
    preco,
    imagem: dados.imagem || '',
    disponivel: dados.disponivel === undefined ? true : Boolean(dados.disponivel),
    ordem: (ultimo?.ordem ?? 0) + 1,
  })
}

export async function atualizarProduto(lojaId, id, dados) {
  const produto = await Produto.findOne({ _id: id, lojaId })

  if (!produto) {
    throw new ApiError(404, 'Produto não encontrado')
  }

  if (dados.nome !== undefined) produto.nome = validarNome(dados.nome, 'produto')
  if (dados.descricao !== undefined) produto.descricao = String(dados.descricao).trim()
  if (dados.preco !== undefined) produto.preco = validarCentavos(dados.preco, 'Preço')
  if (dados.imagem !== undefined) produto.imagem = dados.imagem
  if (dados.disponivel !== undefined) produto.disponivel = Boolean(dados.disponivel)
  if (dados.ordem !== undefined) produto.ordem = Number(dados.ordem) || 0

  if (dados.categoriaId !== undefined) {
    await buscarCategoriaDaLoja(lojaId, dados.categoriaId)
    produto.categoriaId = dados.categoriaId
  }

  await produto.save()
  return produto
}

export async function removerProduto(lojaId, id) {
  const produto = await Produto.findOne({ _id: id, lojaId })

  if (!produto) {
    throw new ApiError(404, 'Produto não encontrado')
  }

  await produto.deleteOne()
}
