import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { autenticar } from '../../middlewares/autenticar.js'
import { exigirLoja } from '../../middlewares/exigirLoja.js'
import { assinar } from './uploads.controller.js'

/*
 * Upload de imagem.
 *
 * Nenhum arquivo entra aqui: esta rota só emite a assinatura que autoriza o
 * navegador a enviar a imagem direto para o Cloudinary. Fica atrás de login e
 * de loja, então visitante do cardápio não consegue gravar nada.
 */

export const rotasUploads = Router()

rotasUploads.use(autenticar, exigirLoja)

rotasUploads.post('/assinatura', asyncHandler(assinar))
