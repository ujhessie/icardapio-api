import { SITUACOES_LOJA } from '../../config/constantes.js'
import { gerarToken } from '../../lib/token.js'
import { Usuario } from '../../models/Usuario.js'
import { criarLoja } from '../lojas/lojas.service.js'

/**
 * Cadastro público: a loja nasce pendente e o dono já sai logado.
 */
export async function cadastrar(dados) {
  const { loja, dono } = await criarLoja({
    ...dados,
    situacao: SITUACOES_LOJA.PENDENTE,
  })

  const usuario = await Usuario.findById(dono.id)

  return {
    token: gerarToken(usuario),
    usuario: usuario.publico(),
    loja,
  }
}
