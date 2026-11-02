import mongoose from 'mongoose'

const bairroSchema = new mongoose.Schema(
  {
    lojaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loja',
      required: true,
    },
    nome: {
      type: String,
      required: [true, 'O nome do bairro é obrigatório'],
      trim: true,
    },
    // Taxa em centavos (500 = R$ 5,00). Zero significa entrega grátis.
    taxaEntrega: {
      type: Number,
      default: 0,
      min: [0, 'A taxa não pode ser negativa'],
    },
    tempoEstimado: {
      type: Number,
      default: 0,
      min: [0, 'O tempo não pode ser negativo'],
    },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' } },
)

bairroSchema.index({ lojaId: 1, nome: 1 }, { unique: true })

export const Bairro = mongoose.model('Bairro', bairroSchema)
