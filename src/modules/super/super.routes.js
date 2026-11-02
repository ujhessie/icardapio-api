import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { autenticar } from '../../middlewares/autenticar.js'
import { exigirSuperadmin } from '../../middlewares/exigirSuperadmin.js'
import { resumo } from './super.controller.js'

export const rotasSuper = Router()

rotasSuper.use(autenticar, exigirSuperadmin)

rotasSuper.get('/resumo', asyncHandler(resumo))
