import { assinarUpload } from '../../lib/cloudinary.js'

export function assinar(req, res) {
  res.json(
    assinarUpload({
      lojaId: req.usuario.lojaId,
      tipo: req.body?.tipo,
    }),
  )
}
