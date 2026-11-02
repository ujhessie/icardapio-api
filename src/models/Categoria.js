import mongoose from 'mongoose'

const categoriaSchema = new mongoose.Schema(
  {
    lojaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loja',
      required: true,
    },
    nome: {
      type: String,
      required: [true, 'O nome da categoria é obrigatório'],
      trim: true,
    },
    ordem: { type: Number, default: 0 },
    ativa: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' } },
)

categoriaSchema.index({ lojaId: 1, ordem: 1 })

export const Categoria = mongoose.model('Categoria', categoriaSchema)
