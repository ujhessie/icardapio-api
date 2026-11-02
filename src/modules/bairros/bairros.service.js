import { ApiError } from '../../lib/ApiError.js'
import { Bairro } from '../../models/Bairro.js'

function validarNome(valor) {
  if (!valor || !String(valor).trim()) {
    throw new ApiError(400, 'Informe o nome do bairro')
  }

  return String(valor).trim()
}

function validarCentavos(valor, campo) {
  const numero = Number(valor)

  if (!Number.isInteger(numero) || numero < 0) {
    throw new ApiError(400, `${campo} inválido. Envie o valor em centavos.`)
  }

  return numero
}

export async function listarBairros(lojaId) {
  return Bairro.find({ lojaId }).sort({ nome: 1 })
}

export async function criarBairro(lojaId, dados) {
  const nome = validarNome(dados.nome)
  const taxaEntrega = validarCentavos(dados.taxaEntrega ?? 0, 'Taxa de entrega')
  const tempoEstimado = validarCentavos(dados.tempoEstimado ?? 0, 'Tempo estimado')

  const existe = await Bairro.exists({ lojaId, nome })

  if (existe) {
    throw new ApiError(409, `Já existe um bairro chamado "${nome}" nesta loja`)
  }

  return Bairro.create({ lojaId, nome, taxaEntrega, tempoEstimado })
}

export async function atualizarBairro(lojaId, id, dados) {
  const bairro = await Bairro.findOne({ _id: id, lojaId })

  if (!bairro) {
    throw new ApiError(404, 'Bairro não encontrado')
  }

  if (dados.nome !== undefined) {
    const nome = validarNome(dados.nome)
    const existe = await Bairro.exists({ lojaId, nome, _id: { $ne: bairro._id } })

    if (existe) {
      throw new ApiError(409, `Já existe um bairro chamado "${nome}" nesta loja`)
    }

    bairro.nome = nome
  }

  if (dados.taxaEntrega !== undefined) {
    bairro.taxaEntrega = validarCentavos(dados.taxaEntrega, 'Taxa de entrega')
  }

  if (dados.tempoEstimado !== undefined) {
    bairro.tempoEstimado = validarCentavos(dados.tempoEstimado, 'Tempo estimado')
  }

  if (dados.ativo !== undefined) bairro.ativo = Boolean(dados.ativo)

  await bairro.save()
  return bairro
}

export async function removerBairro(lojaId, id) {
  const bairro = await Bairro.findOne({ _id: id, lojaId })

  if (!bairro) {
    throw new ApiError(404, 'Bairro não encontrado')
  }

  await bairro.deleteOne()
}
