import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { env } from './config/env.js'
import { rotaNaoEncontrada } from './middlewares/rotaNaoEncontrada.js'
import { tratarErro } from './middlewares/tratarErro.js'

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
// app.use('/api/auth', rotasAuth)

app.use(rotaNaoEncontrada)
app.use(tratarErro)
