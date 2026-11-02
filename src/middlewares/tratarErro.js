import { ApiError } from '../lib/ApiError.js'

export function tratarErro(erro, req, res, next) {
  if (erro instanceof ApiError) {
    return res.status(erro.status).json({ erro: erro.message })
  }

  // Erros comuns do Mongoose, traduzidos para o front.
  if (erro.name === 'ValidationError') {
    const mensagens = Object.values(erro.errors).map((e) => e.message)
    return res.status(400).json({ erro: mensagens.join(', ') })
  }

  if (erro.name === 'CastError') {
    return res.status(400).json({ erro: 'Identificador inválido' })
  }

  if (erro.code === 11000) {
    const campo = Object.keys(erro.keyPattern || {})[0] || 'registro'
    return res.status(409).json({ erro: `Já existe um ${campo} com esse valor` })
  }

  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'Corpo da requisição inválido' })
  }

  console.error(erro)
  return res.status(500).json({ erro: 'Erro interno do servidor' })
}
