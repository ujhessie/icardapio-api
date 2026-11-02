import bcrypt from 'bcryptjs'

const CUSTO = 10

export function criptografarSenha(senha) {
  return bcrypt.hash(senha, CUSTO)
}

export function senhaConfere(senha, hash) {
  return bcrypt.compare(senha, hash)
}
