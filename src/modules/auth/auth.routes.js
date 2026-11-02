import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { autenticar } from '../../middlewares/autenticar.js'
import { entrar, eu } from './auth.controller.js'

export const rotasAuth = Router()

rotasAuth.post('/login', asyncHandler(entrar))
rotasAuth.get('/eu', autenticar, eu)
