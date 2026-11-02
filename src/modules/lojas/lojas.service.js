import { ApiError } from '../../lib/ApiError.js'
import { criptografarSenha } from '../../lib/senha.js'
import { gerarSlug } from '../../lib/slug.js'
import { PAPEIS, SITUACOES_LOJA } from '../../config/constantes.js'
import { Loja } from '../../models/Loja.js'
import { Usuario } from '../../models/Usuario.js'

// Campos que o usuário pode alterar. `slug` fica de fora de propósito: é a URL pública.
// `situacao` também: só o superadmin mexe, por uma rota própria.
const CAMPOS_EDITAVEIS = ['nome', 'telefone', 'logo', 'corPrimaria', 'aberta', 'endereco']

// URLs que o sistema já usa (ou pode usar) e não podem virar nome de loja.
const SLUGS_RESERVADOS = ['admin', 'api', 'auth', 'login', 'painel', 'publico', 'sistema', 'lojas']

function validarSlug(valor) {
  const slug = gerarSlug(valor)

  if (slug.length < 3) {
    throw new ApiError(400, 'A URL precisa ter pelo menos 3 caracteres')
  }

  if (slug.length > 40) {
    throw new ApiError(400, 'A URL pode ter no máximo 40 caracteres')
  }

  if (SLUGS_RESERVADOS.includes(slug)) {
    throw new ApiError(400, `"${slug}" é uma URL reservada pelo sistema. Escolha outra.`)
  }

  return slug
}

async function gerarSlugUnico(nome) {
  const base = gerarSlug(nome) || 'loja'
  let slug = base
  let contador = 2

  while (await Loja.exists({ slug })) {
    slug = `${base}-${contador}`
    contador += 1
  }

  return slug
}

export async function listarLojas({ situacao } = {}) {
  const consulta = {}

  if (situacao) {
    if (!Object.values(SITUACOES_LOJA).includes(situacao)) {
      throw new ApiError(400, 'Situação inválida. Use pendente, ativa ou suspensa.')
    }

    consulta.situacao = situacao
  }

  return Loja.find(consulta).sort({ criadoEm: -1 })
}

export async function buscarLoja(id) {
  const loja = await Loja.findById(id)

  if (!loja) {
    throw new ApiError(404, 'Loja não encontrada')
  }

  return loja
}

export async function criarLoja({
  nome,
  slug,
  telefone,
  dono,
  situacao = SITUACOES_LOJA.ATIVA,
}) {
  if (!nome || !String(nome).trim()) {
    throw new ApiError(400, 'Informe o nome da loja')
  }

  if (!dono?.nome || !dono?.email || !dono?.senha) {
    throw new ApiError(400, 'Informe nome, e-mail e senha do dono')
  }

  if (String(dono.senha).length < 6) {
    throw new ApiError(400, 'A senha do dono precisa ter pelo menos 6 caracteres')
  }

  const email = String(dono.email).toLowerCase().trim()

  if (await Usuario.exists({ email })) {
    throw new ApiError(409, 'Já existe um usuário com esse e-mail')
  }

  // URL escolhida à mão ou gerada a partir do nome.
  let slugFinal

  if (slug && String(slug).trim()) {
    slugFinal = validarSlug(slug)

    if (await Loja.exists({ slug: slugFinal })) {
      throw new ApiError(409, `A URL /${slugFinal} já está em uso. Escolha outra.`)
    }
  } else {
    slugFinal = await gerarSlugUnico(nome)
  }

  const loja = await Loja.create({
    nome: String(nome).trim(),
    slug: slugFinal,
    telefone: telefone ? String(telefone).trim() : '',
    situacao,
  })

  // Se o usuário dono falhar, a loja órfã é removida.
  try {
    const usuario = await Usuario.create({
      nome: String(dono.nome).trim(),
      email,
      senhaHash: await criptografarSenha(dono.senha),
      papel: PAPEIS.DONO,
      lojaId: loja._id,
    })

    return { loja, dono: usuario.publico() }
  } catch (erro) {
    await Loja.findByIdAndDelete(loja._id)
    throw erro
  }
}

function aplicarCampos(loja, dados) {
  for (const campo of CAMPOS_EDITAVEIS) {
    if (dados[campo] === undefined) continue

    if (campo === 'endereco') {
      loja.endereco = { ...loja.endereco.toObject(), ...dados.endereco }
    } else {
      loja[campo] = dados[campo]
    }
  }
}

export async function atualizarLoja(id, dados) {
  const loja = await buscarLoja(id)
  aplicarCampos(loja, dados)
  await loja.save()
  return loja
}

export async function atualizarSituacao(id, situacao) {
  if (!Object.values(SITUACOES_LOJA).includes(situacao)) {
    throw new ApiError(400, 'Situação inválida. Use pendente, ativa ou suspensa.')
  }

  const loja = await buscarLoja(id)
  loja.situacao = situacao
  await loja.save()
  return loja
}

export async function buscarMinhaLoja(lojaId) {
  if (!lojaId) {
    throw new ApiError(400, 'Este usuário não está vinculado a uma loja')
  }

  const loja = await Loja.findById(lojaId)

  if (!loja) {
    throw new ApiError(404, 'Loja não encontrada')
  }

  return loja
}

export async function atualizarMinhaLoja(lojaId, dados) {
  const loja = await buscarMinhaLoja(lojaId)
  aplicarCampos(loja, dados)
  await loja.save()
  return loja
}
