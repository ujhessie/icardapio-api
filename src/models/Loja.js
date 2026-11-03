import mongoose from 'mongoose'
import { SITUACOES_LOJA } from '../config/constantes.js'

const horarioSchema = new mongoose.Schema(
  {
    // 0 = domingo … 6 = sábado (mesmo número do Date.getDay()).
    dia: { type: Number, required: true, min: 0, max: 6 },
    aberto: { type: Boolean, default: true },
    // "HH:MM". Fechar depois da meia-noite é permitido (ex: 18:00 → 02:00).
    abre: { type: String, default: '18:00' },
    fecha: { type: String, default: '23:00' },
  },
  { _id: false },
)

const dataEspecialSchema = new mongoose.Schema(
  {
    // "AAAA-MM-DD": vale só naquele dia, não em todo o dia da semana.
    data: { type: String, required: true },
    motivo: { type: String, trim: true, default: '' },
    fechado: { type: Boolean, default: true },
    abre: { type: String, default: '' },
    fecha: { type: String, default: '' },
  },
  { _id: false },
)

const lojaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'O nome da loja é obrigatório'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    telefone: { type: String, trim: true, default: '' },
    endereco: {
      rua: { type: String, default: '' },
      numero: { type: String, default: '' },
      complemento: { type: String, default: '' },
      cidade: { type: String, default: '' },
      estado: { type: String, default: '' },
    },
    logo: { type: String, default: '' },
    corPrimaria: { type: String, default: '#e85d04' },
    aberta: { type: Boolean, default: true },
    // Grade da semana. Vazia = loja sem grade cadastrada: vale só o interruptor
    // `aberta` (protege as lojas que existiam antes dos horários).
    horarios: { type: [horarioSchema], default: [] },
    datasEspeciais: { type: [dataEspecialSchema], default: [] },
    // pendente = aguardando aprovação | ativa = liberada | suspensa = bloqueada
    situacao: {
      type: String,
      enum: Object.values(SITUACOES_LOJA),
      default: SITUACOES_LOJA.PENDENTE,
    },
    proximoNumero: { type: Number, default: 1 },
  },
  { timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' } },
)

export const Loja = mongoose.model('Loja', lojaSchema)
