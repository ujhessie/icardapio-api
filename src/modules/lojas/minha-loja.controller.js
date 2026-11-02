import { atualizarMinhaLoja, buscarMinhaLoja } from './lojas.service.js'

export async function mostrar(req, res) {
  res.json({ loja: await buscarMinhaLoja(req.usuario.lojaId) })
}

export async function atualizar(req, res) {
  res.json({ loja: await atualizarMinhaLoja(req.usuario.lojaId, req.body) })
}
