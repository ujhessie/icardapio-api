import mongoose from 'mongoose'

const produtoSchema = new mongoose.Schema(
  {
    lojaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loja',
      required: true,
    },
    categoriaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Categoria',
      required: [true, 'Escolha uma categoria'],
    },
    nome: {
      type: String,
      required: [true, 'O nome do produto é obrigatório'],
      trim: true,
    },
    descricao: { type: String, default: '', trim: true },
    // Preço sempre em centavos (2590 = R$ 25,90).
    preco: {
      type: Number,
      required: [true, 'Informe o preço'],
      min: [0, 'O preço não pode ser negativo'],
    },
    imagem: { type: String, default: '' },
    disponivel: { type: Boolean, default: true },
    ordem: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' } },
)

produtoSchema.index({ lojaId: 1, categoriaId: 1, ordem: 1 })
produtoSchema.index({ lojaId: 1, disponivel: 1 })

export const Produto = mongoose.model('Produto', produtoSchema)
