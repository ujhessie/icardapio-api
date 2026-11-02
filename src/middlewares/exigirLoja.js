import { ApiError } from '../lib/ApiError.js'

// Rotas que só fazem sentido para quem está vinculado a uma loja.
// Superadmin não tem loja: ele usa as rotas /api/lojas e /api/super.
export function exigirLoja(req, res, next) {
  if (!req.usuario?.lojaId) {
    return next(new ApiError(403, 'Esta área é da loja. Entre com uma conta de loja.'))
  }

  next()
}
