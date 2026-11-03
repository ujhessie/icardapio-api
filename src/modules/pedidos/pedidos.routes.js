import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { autenticar } from '../../middlewares/autenticar.js'
import { exigirLoja } from '../../middlewares/exigirLoja.js'
import { atualizarStatus, arquivar, detalhar, listar, remover, resumo } from './pedidos.controller.js'

export const rotasPedidos = Router()

rotasPedidos.use(autenticar, exigirLoja)

rotasPedidos.get('/resumo', asyncHandler(resumo))
rotasPedidos.get('/', asyncHandler(listar))
rotasPedidos.get('/:id', asyncHandler(detalhar))
rotasPedidos.patch('/:id/status', asyncHandler(atualizarStatus))
rotasPedidos.patch('/:id/arquivar', asyncHandler(arquivar))
rotasPedidos.delete('/:id', asyncHandler(remover))
