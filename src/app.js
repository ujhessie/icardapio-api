import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { env } from './config/env.js'
import { rotaNaoEncontrada } from './middlewares/rotaNaoEncontrada.js'
import { tratarErro } from './middlewares/tratarErro.js'
import { rotasAuth } from './modules/auth/auth.routes.js'
import { rotasLojas } from './modules/lojas/lojas.routes.js'
import { rotasMinhaLoja } from './modules/lojas/minha-loja.routes.js'
import { rotasCadastro } from './modules/cadastro/cadastro.routes.js'
import { rotasSuper } from './modules/super/super.routes.js'
import { rotasCardapio } from './modules/cardapio/cardapio.routes.js'
import { rotasBairros } from './modules/bairros/bairros.routes.js'
import { rotasPedidos } from './modules/pedidos/pedidos.routes.js'
import { rotasPublico } from './modules/publico/publico.routes.js'

const ESTADOS_BANCO = {
  0: 'desconectado',
  1: 'conectado',
  2: 'conectando',
  3: 'desconectando',
}

export const app = express()

app.use(cors({ origin: env.urlFront }))
app.use(express.json())

app.get('/api/saude', (req, res) => {
  res.json({
    ok: mongoose.connection.readyState === 1,
    api: 'online',
    banco: ESTADOS_BANCO[mongoose.connection.readyState] || 'desconhecido',
    ambiente: env.producao ? 'producao' : 'desenvolvimento',
    horario: new Date().toISOString(),
  })
})

// As rotas dos módulos entram aqui, uma por linha, a partir da fase 1:
app.use('/api/auth', rotasAuth)
app.use('/api/lojas', rotasLojas)
app.use('/api/minha-loja', rotasMinhaLoja)
app.use('/api/cadastro', rotasCadastro)
app.use('/api/super', rotasSuper)
app.use('/api/cardapio', rotasCardapio)
app.use('/api/bairros', rotasBairros)
app.use('/api/pedidos', rotasPedidos)
app.use('/api/publico', rotasPublico)

app.use(rotaNaoEncontrada)
app.use(tratarErro)
