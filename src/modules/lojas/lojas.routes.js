import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { autenticar } from '../../middlewares/autenticar.js'
import { exigirSuperadmin } from '../../middlewares/exigirSuperadmin.js'
import { atualizar, criar, detalhar, listar } from './lojas.controller.js'

export const rotasLojas = Router()

rotasLojas.use(autenticar, exigirSuperadmin)

rotasLojas.get('/', asyncHandler(listar))
rotasLojas.post('/', asyncHandler(criar))
rotasLojas.get('/:id', asyncHandler(detalhar))
rotasLojas.patch('/:id', asyncHandler(atualizar))
