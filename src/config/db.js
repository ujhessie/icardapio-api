import mongoose from 'mongoose'
import { env } from './env.js'

mongoose.set('strictQuery', true)

// Na Vercel cada acesso pode cair numa instância nova, e o módulo é avaliado de
// novo. Guardando no globalThis, uma instância "quente" reaproveita a mesma
// conexão em vez de abrir uma para cada requisição (o que estouraria o Atlas).
const estado = (globalThis.__deliveryMongo ??= {
  promessa: null,
  ouvintes: false,
})

function ouvirConexaoUmaVez() {
  if (estado.ouvintes) return
  estado.ouvintes = true

  mongoose.connection.on('error', (erro) => {
    console.error('Erro na conexão com o MongoDB:', erro.message)
  })

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB desconectado')
    // Deixa a próxima chamada reconectar em vez de devolver uma promessa velha.
    estado.promessa = null
  })
}

/**
 * Conecta no banco — ou reaproveita a conexão que já está de pé.
 * Pode ser chamada em toda requisição sem custo.
 */
export async function conectarBanco() {
  ouvirConexaoUmaVez()

  if (mongoose.connection.readyState === 1) return mongoose.connection

  if (!estado.promessa) {
    estado.promessa = mongoose
      .connect(env.mongoUri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then((instancia) => {
        console.log(`MongoDB conectado no banco "${instancia.connection.name}"`)
        return instancia.connection
      })
      .catch((erro) => {
        estado.promessa = null
        throw erro
      })
  }

  return estado.promessa
}

export async function desconectarBanco() {
  estado.promessa = null
  await mongoose.connection.close()
}
