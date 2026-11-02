import { cadastrar } from './cadastro.service.js'

export async function criar(req, res) {
  res.status(201).json(await cadastrar(req.body))
}
