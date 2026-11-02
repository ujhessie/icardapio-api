import {
  atualizarLoja,
  atualizarSituacao,
  buscarLoja,
  criarLoja,
  listarLojas,
} from './lojas.service.js'

export async function listar(req, res) {
  res.json({ lojas: await listarLojas({ situacao: req.query.situacao }) })
}

export async function detalhar(req, res) {
  res.json({ loja: await buscarLoja(req.params.id) })
}

export async function criar(req, res) {
  // Loja criada pelo superadmin já nasce ativa.
  const resultado = await criarLoja(req.body)
  res.status(201).json(resultado)
}

export async function atualizar(req, res) {
  res.json({ loja: await atualizarLoja(req.params.id, req.body) })
}

export async function mudarSituacao(req, res) {
  res.json({ loja: await atualizarSituacao(req.params.id, req.body.situacao) })
}
