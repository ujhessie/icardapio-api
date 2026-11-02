import {
  FORMAS_PAGAMENTO,
  SITUACOES_LOJA,
  STATUS_PEDIDO,
  TIPOS_PEDIDO,
} from '../../config/constantes.js'
import { ApiError } from '../../lib/ApiError.js'
import { Bairro } from '../../models/Bairro.js'
import { Categoria } from '../../models/Categoria.js'
import { Loja } from '../../models/Loja.js'
import { Pedido } from '../../models/Pedido.js'
import { Produto } from '../../models/Produto.js'

function texto(valor) {
  return valor === undefined || valor === null ? '' : String(valor).trim()
}

function exigirTexto(valor, mensagem) {
  const limpo = texto(valor)

  if (!limpo) {
    throw new ApiError(400, mensagem)
  }

  return limpo
}

async function buscarLojaPorSlug(slug) {
  const loja = await Loja.findOne({ slug: texto(slug).toLowerCase() })

  if (!loja) {
    throw new ApiError(404, 'Loja não encontrada')
  }

  return loja
}

// Cardápio e pedidos só existem para loja ativa (aprovada pelo superadmin).
async function buscarLojaAtiva(slug) {
  const loja = await buscarLojaPorSlug(slug)

  if (loja.situacao !== SITUACOES_LOJA.ATIVA) {
    throw new ApiError(404, 'Loja não encontrada')
  }

  return loja
}

export async function montarCardapio(slug) {
  const loja = await buscarLojaAtiva(slug)

  const [categorias, produtos, bairros] = await Promise.all([
    Categoria.find({ lojaId: loja._id, ativa: true }).sort({ ordem: 1, nome: 1 }),
    Produto.find({ lojaId: loja._id, disponivel: true }).sort({ ordem: 1, nome: 1 }),
    Bairro.find({ lojaId: loja._id, ativo: true }).sort({ nome: 1 }),
  ])

  return {
    loja: {
      _id: loja._id,
      nome: loja.nome,
      slug: loja.slug,
      telefone: loja.telefone,
      logo: loja.logo,
      corPrimaria: loja.corPrimaria,
      aberta: loja.aberta,
      endereco: loja.endereco,
    },
    // Categoria sem produto disponível não aparece no cardápio.
    categorias: categorias
      .map((categoria) => ({
        _id: categoria._id,
        nome: categoria.nome,
        produtos: produtos
          .filter((produto) => String(produto.categoriaId) === String(categoria._id))
          .map((produto) => ({
            _id: produto._id,
            nome: produto.nome,
            descricao: produto.descricao,
            preco: produto.preco,
            imagem: produto.imagem,
          })),
      }))
      .filter((categoria) => categoria.produtos.length > 0),
    bairros: bairros.map((bairro) => ({
      _id: bairro._id,
      nome: bairro.nome,
      taxaEntrega: bairro.taxaEntrega,
      tempoEstimado: bairro.tempoEstimado,
    })),
  }
}

function pedidoPublico(pedido) {
  return {
    _id: pedido._id,
    numero: pedido.numero,
    status: pedido.status,
    tipo: pedido.tipo,
    cliente: pedido.cliente,
    endereco: pedido.endereco,
    bairroNome: pedido.bairroNome,
    taxaEntrega: pedido.taxaEntrega,
    itens: pedido.itens,
    subtotal: pedido.subtotal,
    total: pedido.total,
    pagamento: pedido.pagamento,
    trocoPara: pedido.trocoPara,
    observacao: pedido.observacao,
    criadoEm: pedido.criadoEm,
  }
}

export async function criarPedido(slug, dados = {}) {
  const loja = await buscarLojaAtiva(slug)

  if (!loja.aberta) {
    throw new ApiError(400, 'A loja está fechada e não está aceitando pedidos agora')
  }

  if (!Object.values(TIPOS_PEDIDO).includes(dados.tipo)) {
    throw new ApiError(400, 'Tipo de pedido inválido')
  }

  if (!FORMAS_PAGAMENTO.includes(dados.pagamento)) {
    throw new ApiError(400, 'Forma de pagamento inválida')
  }

  if (!Array.isArray(dados.itens) || dados.itens.length === 0) {
    throw new ApiError(400, 'O carrinho está vazio')
  }

  const cliente = {
    nome: exigirTexto(dados.cliente?.nome, 'Informe seu nome'),
    telefone: exigirTexto(dados.cliente?.telefone, 'Informe seu telefone'),
  }

  const itens = []
  let subtotal = 0

  for (const item of dados.itens) {
    const quantidade = Number(item?.quantidade)

    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 99) {
      throw new ApiError(400, 'Quantidade inválida')
    }

    const produto = await Produto.findOne({
      _id: item.produtoId,
      lojaId: loja._id,
      disponivel: true,
    })

    if (!produto) {
      throw new ApiError(400, 'Um dos produtos não está mais disponível. Atualize o cardápio.')
    }

    itens.push({
      produtoId: produto._id,
      nome: produto.nome,
      precoUnitario: produto.preco,
      quantidade,
      observacao: texto(item.observacao),
    })

    subtotal += produto.preco * quantidade
  }

  let endereco = { rua: '', numero: '', complemento: '', referencia: '' }
  let bairroId = null
  let bairroNome = ''
  let taxaEntrega = 0

  if (dados.tipo === TIPOS_PEDIDO.DELIVERY) {
    const bairro = await Bairro.findOne({
      _id: dados.bairroId,
      lojaId: loja._id,
      ativo: true,
    })

    if (!bairro) {
      throw new ApiError(400, 'Escolha um bairro para entrega')
    }

    endereco = {
      rua: exigirTexto(dados.endereco?.rua, 'Informe a rua'),
      numero: exigirTexto(dados.endereco?.numero, 'Informe o número'),
      complemento: texto(dados.endereco?.complemento),
      referencia: texto(dados.endereco?.referencia),
    }

    bairroId = bairro._id
    bairroNome = bairro.nome
    taxaEntrega = bairro.taxaEntrega
  }

  const total = subtotal + taxaEntrega
  const trocoPara = dados.pagamento === 'dinheiro' ? Number(dados.trocoPara || 0) : 0

  if (!Number.isInteger(trocoPara) || trocoPara < 0) {
    throw new ApiError(400, 'Valor de troco inválido')
  }

  if (trocoPara > 0 && trocoPara < total) {
    throw new ApiError(400, 'O valor para troco é menor que o total do pedido')
  }

  // Lojas antigas podem não ter o contador; garante pelo menos 1 antes do $inc.
  if (!loja.proximoNumero) {
    await Loja.updateOne(
      {
        _id: loja._id,
        $or: [{ proximoNumero: { $exists: false } }, { proximoNumero: { $lt: 1 } }],
      },
      { $set: { proximoNumero: 1 } },
    )
  }

  // $inc atômico: dois pedidos no mesmo segundo recebem números diferentes.
  const lojaAntes = await Loja.findOneAndUpdate(
    { _id: loja._id },
    { $inc: { proximoNumero: 1 } },
    { new: false },
  )

  const pedido = await Pedido.create({
    lojaId: loja._id,
    numero: lojaAntes.proximoNumero,
    cliente,
    tipo: dados.tipo,
    endereco,
    bairroId,
    bairroNome,
    taxaEntrega,
    itens,
    subtotal,
    total,
    status: STATUS_PEDIDO.NOVO,
    pagamento: dados.pagamento,
    trocoPara,
    observacao: texto(dados.observacao),
  })

  return pedidoPublico(pedido)
}

export async function buscarPedidoPublico(slug, id) {
  // O acompanhamento funciona mesmo se a loja fechar ou for suspensa depois do pedido.
  const loja = await buscarLojaPorSlug(slug)
  const pedido = await Pedido.findOne({ _id: id, lojaId: loja._id })

  if (!pedido) {
    throw new ApiError(404, 'Pedido não encontrado')
  }

  return pedidoPublico(pedido)
}
