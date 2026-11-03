import mongoose from 'mongoose'
import { FORMAS_PAGAMENTO, STATUS_PEDIDO, TIPOS_PEDIDO } from '../config/constantes.js'

const itemSchema = new mongoose.Schema(
  {
    produtoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Produto',
      required: true,
    },
    // Cópia do produto no momento da compra: mudar o preço depois não altera o pedido.
    nome: { type: String, required: true, trim: true },
    precoUnitario: { type: Number, required: true, min: 0 },
    quantidade: { type: Number, required: true, min: 1 },
    observacao: { type: String, default: '', trim: true },
  },
  { _id: false },
)

const pedidoSchema = new mongoose.Schema(
  {
    lojaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loja',
      required: true,
    },
    numero: { type: Number, required: true, min: 1 },
    cliente: {
      nome: { type: String, required: [true, 'Informe seu nome'], trim: true },
      telefone: { type: String, required: [true, 'Informe seu telefone'], trim: true },
    },
    tipo: {
      type: String,
      enum: Object.values(TIPOS_PEDIDO),
      required: true,
    },
    endereco: {
      rua: { type: String, default: '' },
      numero: { type: String, default: '' },
      complemento: { type: String, default: '' },
      referencia: { type: String, default: '' },
    },
    bairroId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bairro',
      default: null,
    },
    bairroNome: { type: String, default: '', trim: true },
    taxaEntrega: { type: Number, default: 0, min: 0 },
    itens: {
      type: [itemSchema],
      validate: {
        validator: (itens) => itens.length > 0,
        message: 'O pedido precisa de pelo menos um item',
      },
    },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(STATUS_PEDIDO),
      default: STATUS_PEDIDO.NOVO,
    },
    pagamento: {
      type: String,
      enum: FORMAS_PAGAMENTO,
      required: true,
    },
    // Só faz sentido no dinheiro. Guardado em centavos.
    trocoPara: { type: Number, default: 0, min: 0 },
    observacao: { type: String, default: '', trim: true },
    // Arquivar é etiqueta, não exclusão: o pedido sai do quadro mas continua
    // valendo para relatórios, faturamento e histórico.
    arquivado: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' } },
)

pedidoSchema.index({ lojaId: 1, numero: 1 }, { unique: true })
pedidoSchema.index({ lojaId: 1, status: 1, criadoEm: -1 })
pedidoSchema.index({ lojaId: 1, arquivado: 1, criadoEm: -1 })

export const Pedido = mongoose.model('Pedido', pedidoSchema)
