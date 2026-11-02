import { ApiError } from '../lib/ApiError.js'
import { PAPEIS } from '../config/constantes.js'

export function exigirSuperadmin(req, res, next) {
  if (req.usuario?.papel !== PAPEIS.SUPERADMIN) {
    return next(new ApiError(403, 'Acesso restrito ao superadmin'))
  }

  next()
}
