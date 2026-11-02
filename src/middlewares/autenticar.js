import { ApiError } from '../lib/ApiError.js'
import { verificarToken } from '../lib/token.js'
import { Usuario } from '../models/Usuario.js'

/**
 * Lê o token do header Authorization, busca o usuário no banco
 * e deixa disponível em req.usuario.
 */
export async function autenticar(req, res, next) {
  try {
    const cabecalho = req.headers.authorization || ''
    const [tipo, token] = cabecalho.split(' ')

    if (tipo !== 'Bearer' || !token) {
      throw new ApiError(401, 'Token não enviado')
    }

    const dados = verificarToken(token)
    const usuario = await Usuario.findById(dados.id)

    if (!usuario) {
      throw new ApiError(401, 'Usuário não encontrado')
    }

    if (!usuario.ativo) {
      throw new ApiError(403, 'Usuário inativo')
    }

    req.usuario = usuario
    next()
  } catch (erro) {
    if (erro instanceof ApiError) return next(erro)

    if (erro.name === 'JsonWebTokenError' || erro.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Sessão inválida ou expirada. Entre de novo.'))
    }

    next(erro)
  }
}
