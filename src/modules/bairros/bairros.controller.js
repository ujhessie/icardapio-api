import {
  atualizarBairro,
  criarBairro,
  listarBairros,
  removerBairro,
} from './bairros.service.js'

export async function listar(req, res) {
  res.json({ bairros: await listarBairros(req.usuario.lojaId) })
}

export async function criar(req, res) {
  res.status(201).json({ bairro: await criarBairro(req.usuario.lojaId, req.body) })
}

export async function atualizar(req, res) {
  res.json({ bairro: await atualizarBairro(req.usuario.lojaId, req.params.id, req.body) })
}

export async function remover(req, res) {
  await removerBairro(req.usuario.lojaId, req.params.id)
  res.status(204).end()
}
