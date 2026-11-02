import http from 'node:http'
import { app } from './app.js'
import { env } from './config/env.js'
import { conectarBanco, desconectarBanco } from './config/db.js'
import { iniciarSocket } from './lib/socket.js'

async function iniciar() {
  try {
    await conectarBanco()

    const servidor = http.createServer(app)
    iniciarSocket(servidor)

    servidor.listen(env.porta, () => {
      console.log(`API rodando em http://localhost:${env.porta}/api`)
    })

    const encerrar = async (sinal) => {
      console.log(`\n${sinal} recebido, encerrando...`)
      servidor.close()
      await desconectarBanco()
      process.exit(0)
    }

    process.on('SIGINT', () => encerrar('SIGINT'))
    process.on('SIGTERM', () => encerrar('SIGTERM'))
  } catch (erro) {
    console.error('Não foi possível iniciar o servidor:', erro.message)
    process.exit(1)
  }
}

iniciar()
