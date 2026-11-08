import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { ApiError } from './ApiError.js'

/*
 * Cloudinary com upload assinado.
 *
 * O arquivo NÃO passa pela API: o navegador pede uma assinatura aqui, recebe
 * cloudName/apiKey/timestamp/signature e envia o arquivo direto para o
 * Cloudinary. Dois motivos:
 *
 * 1. A Vercel corta requisição acima de ~4,5 MB — foto de celular passa disso.
 * 2. A API secret nunca sai do servidor. Um preset "unsigned" permitiria
 *    qualquer visitante gravar na conta.
 *
 * A assinatura é o sha1 de "chave=valor&chave=valor" (ordem alfabética) com a
 * secret colada no fim. É o formato que o Cloudinary espera em `signature`.
 */

// O que cada tipo de imagem vira antes de encostar no banco: pasta e
// transformação já aplicadas no upload, para o cardápio baixar só o necessário.
const RECEITAS = {
  produto: {
    pasta: 'produtos',
    transformacao: 'c_fill,g_auto,w_900,h_900,q_auto:good,f_auto',
  },
  logo: {
    // c_limit não aumenta nem recorta: logo pequena e com fundo transparente
    // continua inteira.
    pasta: 'logo',
    transformacao: 'c_limit,w_400,q_auto:good',
  },
  capa: {
    pasta: 'capa',
    transformacao: 'c_fill,g_auto,w_1600,h_700,q_auto:good,f_auto',
  },
}

export const TIPOS_DE_IMAGEM = Object.keys(RECEITAS)

export function cloudinaryConfigurado() {
  return Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret)
}

function exigirConfiguracao() {
  if (!cloudinaryConfigurado()) {
    throw new ApiError(
      503,
      'Upload de imagem indisponível: faltam as variáveis CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET no servidor.',
    )
  }
}

function assinar(parametros, secret) {
  const paraAssinar = Object.keys(parametros)
    .sort()
    .map((chave) => `${chave}=${parametros[chave]}`)
    .join('&')

  return crypto.createHash('sha1').update(paraAssinar + secret).digest('hex')
}

/**
 * Devolve o pacote que o navegador precisa para enviar UMA imagem.
 * A pasta amarra o arquivo à loja: ninguém grava na pasta de outra loja.
 */
export function assinarUpload({ lojaId, tipo }) {
  exigirConfiguracao()

  const receita = RECEITAS[tipo]

  if (!receita) {
    throw new ApiError(400, `Tipo de imagem inválido. Use: ${TIPOS_DE_IMAGEM.join(', ')}.`)
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const parametros = {
    folder: `icardapio/lojas/${lojaId}/${receita.pasta}`,
    timestamp,
    transformation: receita.transformacao,
  }

  return {
    cloudName: env.cloudinaryCloudName,
    apiKey: env.cloudinaryApiKey,
    timestamp,
    folder: parametros.folder,
    transformation: parametros.transformation,
    signature: assinar(parametros, env.cloudinaryApiSecret),
    // O front usa para montar a URL do envio (endpoint do Cloudinary).
    enviarPara: `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`,
  }
}
