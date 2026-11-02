import { ApiError } from '../../lib/ApiError.js'
import { senhaConfere } from '../../lib/senha.js'
import { gerarToken } from '../../lib/token.js'
import { Usuario } from '../../models/Usuario.js'

export async function login({ email, senha }) {
  if (!email || !senha) {
    throw new ApiError(400, 'Informe e-mail e senha')
  }

  const usuario = await Usuario.findOne({ email: String(email).toLowerCase().trim() }).select(
    '+senhaHash',
  )

  if (!usuario) {
    throw new ApiError(401, 'E-mail ou senha incorretos')
  }

  if (!usuario.ativo) {
    throw new ApiError(403, 'Usuário inativo. Fale com o responsável da loja.')
  }

  const confere = await senhaConfere(senha, usuario.senhaHash)

  if (!confere) {
    throw new ApiError(401, 'E-mail ou senha incorretos')
  }

  return {
    token: gerarToken(usuario),
    usuario: usuario.publico(),
  }
}
