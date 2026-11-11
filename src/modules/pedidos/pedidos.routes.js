import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { autenticar } from '../../middlewares/autenticar.js'
import { exigirLoja } from '../../middlewares/exigirLoja.js'
import { atualizarStatus, arquivar, criar, detalhar, editar, estatisticas, listar, remover, resumo } from './pedidos.controller.js'

export const rotasPedidos = Router()

rotasPedidos.use(autenticar, exigirLoja)

rotasPedidos.get('/resumo', asyncHandler(resumo))
rotasPedidos.get('/estatisticas', asyncHandler(estatisticas))
rotasPedidos.get('/', asyncHandler(listar))
rotasPedidos.post('/', asyncHandler(criar))
rotasPedidos.get('/:id', asyncHandler(detalhar))
rotasPedidos.patch('/:id', asyncHandler(editar))
rotasPedidos.patch('/:id/status', asyncHandler(atualizarStatus))
rotasPedidos.patch('/:id/arquivar', asyncHandler(arquivar))
rotasPedidos.delete('/:id', asyncHandler(remover))
