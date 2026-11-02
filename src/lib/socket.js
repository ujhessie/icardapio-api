import { Server } from 'socket.io'
import { env } from '../config/env.js'

let io = null

export function iniciarSocket(servidorHttp) {
  io = new Server(servidorHttp, {
    cors: { origin: env.urlFront, methods: ['GET', 'POST'] },
  })

  io.on('connection', (socket) => {
    // TODO fase 4: exigir token do usuário aqui antes de deixar entrar na sala.
    socket.on('entrar:loja', (lojaId) => {
      if (lojaId) socket.join(`loja:${lojaId}`)
    })

    socket.on('entrar:pedido', (pedidoId) => {
      if (pedidoId) socket.join(`pedido:${pedidoId}`)
    })
  })

  return io
}

export function emitirParaLoja(lojaId, evento, dados) {
  if (!io) return
  io.to(`loja:${lojaId}`).emit(evento, dados)
}

export function emitirParaPedido(pedidoId, evento, dados) {
  if (!io) return
  io.to(`pedido:${pedidoId}`).emit(evento, dados)
}
