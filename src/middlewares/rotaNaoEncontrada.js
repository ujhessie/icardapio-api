import { ApiError } from '../lib/ApiError.js'

export function rotaNaoEncontrada(req, res, next) {
  next(new ApiError(404, `Rota não encontrada: ${req.method} ${req.originalUrl}`))
}
