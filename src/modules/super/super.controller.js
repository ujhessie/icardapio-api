import { resumoGeral } from './super.service.js'

export async function resumo(req, res) {
  res.json(await resumoGeral())
}
