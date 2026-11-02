import mongoose from 'mongoose'

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
    ativa: { type: Boolean, default: true },
    proximoNumero: { type: Number, default: 1 },
  },
  { timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' } },
)

export const Loja = mongoose.model('Loja', lojaSchema)
