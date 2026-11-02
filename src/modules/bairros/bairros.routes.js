import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { autenticar } from '../../middlewares/autenticar.js'
import { exigirLoja } from '../../middlewares/exigirLoja.js'
import { atualizar, criar, listar, remover } from './bairros.controller.js'

export const rotasBairros = Router()

rotasBairros.use(autenticar, exigirLoja)

rotasBairros.get('/', asyncHandler(listar))
rotasBairros.post('/', asyncHandler(criar))
rotasBairros.patch('/:id', asyncHandler(atualizar))
rotasBairros.delete('/:id', asyncHandler(remover))
