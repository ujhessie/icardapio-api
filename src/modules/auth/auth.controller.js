import { login } from './auth.service.js'

export async function entrar(req, res) {
  const dados = await login(req.body)
  res.json(dados)
}

export function eu(req, res) {
  res.json({ usuario: req.usuario.publico() })
}
