import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { criar } from './cadastro.controller.js'

export const rotasCadastro = Router()

// Público: qualquer pessoa pode pedir a criação de uma loja.
rotasCadastro.post('/', asyncHandler(criar))
