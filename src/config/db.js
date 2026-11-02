import mongoose from 'mongoose'
import { env } from './env.js'

export async function conectarBanco() {
  mongoose.set('strictQuery', true)

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  })

  console.log(`MongoDB conectado no banco "${mongoose.connection.name}"`)

  mongoose.connection.on('error', (erro) => {
    console.error('Erro na conexão com o MongoDB:', erro.message)
  })

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB desconectado')
  })
}

export async function desconectarBanco() {
  await mongoose.connection.close()
}
