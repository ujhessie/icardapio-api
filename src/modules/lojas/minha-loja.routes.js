import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { autenticar } from '../../middlewares/autenticar.js'
import { atualizar, mostrar } from './minha-loja.controller.js'

export const rotasMinhaLoja = Router()

rotasMinhaLoja.use(autenticar)

rotasMinhaLoja.get('/', asyncHandler(mostrar))
rotasMinhaLoja.patch('/', asyncHandler(atualizar))
