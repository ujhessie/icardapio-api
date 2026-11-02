import { ApiError } from '../../lib/ApiError.js'
import { criptografarSenha } from '../../lib/senha.js'
import { gerarSlug } from '../../lib/slug.js'
import { PAPEIS } from '../../config/constantes.js'
import { Loja } from '../../models/Loja.js'
import { Usuario } from '../../models/Usuario.js'

// Campos que o usuário pode alterar. `slug` fica de fora de propósito: é a URL pública.
const CAMPOS_EDITAVEIS = ['nome', 'telefone', 'logo', 'corPrimaria', 'aberta', 'ativa', 'endereco']

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

export async function listarLojas() {
  return Loja.find().sort({ criadoEm: -1 })
}

export async function buscarLoja(id) {
  const loja = await Loja.findById(id)

  if (!loja) {
    throw new ApiError(404, 'Loja não encontrada')
  }

  return loja
}

export async function criarLoja({ nome, telefone, dono }) {
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

  const loja = await Loja.create({
    nome: String(nome).trim(),
    slug: await gerarSlugUnico(nome),
    telefone: telefone ? String(telefone).trim() : '',
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
