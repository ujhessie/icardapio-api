import { Server } from 'socket.io'
import { env } from '../config/env.js'
import { verificarToken } from './token.js'

let io = null

export function iniciarSocket(servidorHttp) {
  io = new Server(servidorHttp, {
    cors: { origin: env.urlFront, methods: ['GET', 'POST'] },
  })

  io.on('connection', (socket) => {
    // O painel manda o token e entra só na sala da própria loja.
    // Assim um lojista nunca recebe pedido de outro, mesmo tentando na mão.
    socket.on('entrar:loja', (token) => {
      try {
        const dados = verificarToken(token)
        if (dados.lojaId) socket.join(`loja:${dados.lojaId}`)
      } catch {
        // Token inválido: ignora e não entra em sala nenhuma.
      }
    })

    // Acompanhamento do cliente: o id do pedido é a chave da sala (sem login).
    socket.on('entrar:pedido', (pedidoId) => {
      if (typeof pedidoId === 'string' && pedidoId.length >= 12) {
        socket.join(`pedido:${pedidoId}`)
      }
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
