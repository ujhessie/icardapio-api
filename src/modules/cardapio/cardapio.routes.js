import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { autenticar } from '../../middlewares/autenticar.js'
import { exigirLoja } from '../../middlewares/exigirLoja.js'
import {
  atualizarCategoriaController,
  atualizarProdutoController,
  criarCategoriaController,
  criarProdutoController,
  listarCategoriasController,
  listarProdutosController,
  removerCategoriaController,
  removerProdutoController,
} from './cardapio.controller.js'

export const rotasCardapio = Router()

rotasCardapio.use(autenticar, exigirLoja)

rotasCardapio.get('/categorias', asyncHandler(listarCategoriasController))
rotasCardapio.post('/categorias', asyncHandler(criarCategoriaController))
rotasCardapio.patch('/categorias/:id', asyncHandler(atualizarCategoriaController))
rotasCardapio.delete('/categorias/:id', asyncHandler(removerCategoriaController))

rotasCardapio.get('/produtos', asyncHandler(listarProdutosController))
rotasCardapio.post('/produtos', asyncHandler(criarProdutoController))
rotasCardapio.patch('/produtos/:id', asyncHandler(atualizarProdutoController))
rotasCardapio.delete('/produtos/:id', asyncHandler(removerProdutoController))
