import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { cardapio, criar, detalharPedido, meusPedidos } from './publico.controller.js'

export const rotasPublico = Router()

// Sem login: o slug identifica a loja.
rotasPublico.get('/:slug', asyncHandler(cardapio))
rotasPublico.get('/:slug/pedidos', asyncHandler(meusPedidos))
rotasPublico.post('/:slug/pedidos', asyncHandler(criar))
rotasPublico.get('/:slug/pedidos/:id', asyncHandler(detalharPedido))
