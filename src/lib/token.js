import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function gerarToken(usuario) {
  return jwt.sign(
    {
      id: usuario._id.toString(),
      papel: usuario.papel,
      lojaId: usuario.lojaId ? usuario.lojaId.toString() : null,
    },
    env.jwtSegredo,
    { expiresIn: env.jwtExpiraEm },
  )
}

export function verificarToken(token) {
  return jwt.verify(token, env.jwtSegredo)
}
