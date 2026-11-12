import {
  FORMAS_PAGAMENTO,
  MODOS_BALCAO,
  SITUACOES_LOJA,
  STATUS_PEDIDO,
  TIPOS_DO_CLIENTE,
  TIPOS_PEDIDO,
} from '../../config/constantes.js'
import mongoose from 'mongoose'
import { ApiError } from '../../lib/ApiError.js'
import { statusDaLoja } from '../../lib/horario.js'
import { pedidoPublico } from '../../lib/pedidoPublico.js'
import { emitirParaLoja } from '../../lib/socket.js'
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

/*
 * O balcão está liberado?
 *
 * - `cliente`: sempre. O cliente pede e retira.
 * - `link`: só com o código do endereço exclusivo que o lojista mandou.
 * - `off`: nunca.
 *
 * O código é comparado sem diferenciar maiúscula de minúscula — ele é copiado
 * de um link e colado à mão no WhatsApp.
 */
function balcaoLiberado(loja, codigo) {
  const modo = loja.fluxoPedidos?.modoBalcao || MODOS_BALCAO.CLIENTE

  if (modo === MODOS_BALCAO.CLIENTE) return true
  if (modo !== MODOS_BALCAO.LINK) return false

  const esperado = texto(loja.fluxoPedidos?.codigoBalcao).toUpperCase()
  const enviado = texto(codigo).toUpperCase()

  return Boolean(esperado) && esperado === enviado
}

export async function montarCardapio(slug, codigoBalcao) {
  const loja = await buscarLojaAtiva(slug)

  const [categorias, produtos, bairros] = await Promise.all([
    Categoria.find({ lojaId: loja._id, ativa: true }).sort({ ordem: 1, nome: 1 }),
    Produto.find({ lojaId: loja._id, disponivel: true }).sort({ ordem: 1, nome: 1 }),
    Bairro.find({ lojaId: loja._id, ativo: true }).sort({ nome: 1 }),
  ])

  // O front recalcula esse status sozinho enquanto a página está aberta; aqui
  // vai o valor do instante em que a página abriu.
  const status = statusDaLoja(loja)

  return {
    loja: {
      _id: loja._id,
      nome: loja.nome,
      slug: loja.slug,
      telefone: loja.telefone,
      logo: loja.logo,
      capa: loja.capa,
      corPrimaria: loja.corPrimaria,
      // `aberta` é o interruptor do dono; `abertoAgora` já considera a grade.
      aberta: loja.aberta,
      abertoAgora: status.aberto,
      statusTexto: status.texto,
      horarios: loja.horarios,
      datasEspeciais: loja.datasEspeciais,
      endereco: loja.endereco,
      // A tela de acompanhamento desenha os mesmos passos que o painel: se a
      // loja esconde uma etapa, o cliente não vê essa etapa.
      fluxoPedidos: loja.fluxoPedidos,
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
    // O checkout esconde "Retirar na loja" quando falso.
    balcaoLiberado: balcaoLiberado(loja, codigoBalcao),
  }
}

export async function criarPedido(slug, dados = {}) {
  const loja = await buscarLojaAtiva(slug)
  const status = statusDaLoja(loja)

  if (!status.aberto) {
    throw new ApiError(
      400,
      `A loja não está aceitando pedidos agora. ${status.texto}`,
    )
  }

  if (!TIPOS_DO_CLIENTE.includes(dados.tipo)) {
    throw new ApiError(400, 'Tipo de pedido inválido')
  }

  // Balcão é o único tipo que a loja pode fechar sem fechar a loja inteira.
  if (dados.tipo === TIPOS_PEDIDO.BALCAO && !balcaoLiberado(loja, dados.codigoBalcao)) {
    const modo = loja.fluxoPedidos?.modoBalcao || MODOS_BALCAO.CLIENTE

    throw new ApiError(
      400,
      modo === MODOS_BALCAO.LINK
        ? 'Este link de retirada não vale mais. Peça o link atualizado para a loja.'
        : 'Esta loja não está aceitando pedidos para retirar no balcão agora.',
    )
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

  // Auto-aceite ligado: o pedido já nasce "aceito" e o marco é gravado agora,
  // senão o contador da etapa começaria a contar do zero errado.
  const autoAceite = loja.fluxoPedidos?.autoAceite === true
  const agora = new Date()

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
    status: autoAceite ? STATUS_PEDIDO.ACEITO : STATUS_PEDIDO.NOVO,
    aceitoAutomaticamente: autoAceite,
    marcos: autoAceite ? { aceitoEm: agora } : {},
    pagamento: dados.pagamento,
    trocoPara,
    observacao: texto(dados.observacao),
  })

  // Avisa o painel da loja na hora: sem isso o lojista só veria o pedido
  // recarregando a página.
  emitirParaLoja(loja._id, 'pedido:novo', { pedido: pedidoPublico(pedido) })

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

const LIMITE_MEUS_PEDIDOS = 50

/**
 * Histórico do cliente sem login: o front guarda os ids no localStorage e manda
 * de volta. O id do pedido é o segredo (igual ao link de acompanhamento), então
 * só devolvemos id válido e pedido da própria loja — nunca de outra.
 */
export async function listarPedidosPublicos(slug, ids) {
  const loja = await buscarLojaPorSlug(slug)

  const lista = String(ids || '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => mongoose.isValidObjectId(item))
    .slice(0, LIMITE_MEUS_PEDIDOS)

  if (lista.length === 0) return []

  const pedidos = await Pedido.find({ _id: { $in: lista }, lojaId: loja._id })
  const porId = new Map(pedidos.map((pedido) => [String(pedido._id), pedido]))

  // Na ordem em que o front pediu: o mais recente primeiro.
  return lista
    .map((id) => porId.get(id))
    .filter(Boolean)
    .map(pedidoPublico)
}
