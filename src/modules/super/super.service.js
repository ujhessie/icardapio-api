import { SITUACOES_LOJA } from '../../config/constantes.js'
import { Loja } from '../../models/Loja.js'

export async function resumoGeral() {
  const [total, ativas, pendentes, suspensas] = await Promise.all([
    Loja.countDocuments(),
    Loja.countDocuments({ situacao: SITUACOES_LOJA.ATIVA }),
    Loja.countDocuments({ situacao: SITUACOES_LOJA.PENDENTE }),
    Loja.countDocuments({ situacao: SITUACOES_LOJA.SUSPENSA }),
  ])

  return {
    lojas: { total, ativas, pendentes, suspensas },
  }
}
