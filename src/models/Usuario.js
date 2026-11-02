import mongoose from 'mongoose'
import { PAPEIS } from '../config/constantes.js'

const usuarioSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'O nome do usuário é obrigatório'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'O e-mail é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    senhaHash: {
      type: String,
      required: true,
      select: false,
    },
    papel: {
      type: String,
      enum: Object.values(PAPEIS),
      default: PAPEIS.DONO,
    },
    lojaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loja',
      default: null,
    },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' } },
)

usuarioSchema.index({ lojaId: 1, ativo: 1 })

// Versão do usuário que pode ir para o front (sem hash de senha).
usuarioSchema.methods.publico = function publico() {
  return {
    id: this._id.toString(),
    nome: this.nome,
    email: this.email,
    papel: this.papel,
    lojaId: this.lojaId ? this.lojaId.toString() : null,
    ativo: this.ativo,
  }
}

export const Usuario = mongoose.model('Usuario', usuarioSchema)
