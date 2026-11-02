import { conectarBanco, desconectarBanco } from '../config/db.js'
import { PAPEIS } from '../config/constantes.js'
import { criptografarSenha } from '../lib/senha.js'
import { Usuario } from '../models/Usuario.js'

const EMAIL = process.env.SUPERADMIN_EMAIL || 'admin@sistema.com'
const SENHA = process.env.SUPERADMIN_SENHA || 'admin123'
const NOME = process.env.SUPERADMIN_NOME || 'Administrador'

async function main() {
  await conectarBanco()

  const existente = await Usuario.findOne({ email: EMAIL })

  if (existente) {
    console.log(`Já existe um usuário com o e-mail ${EMAIL} (papel: ${existente.papel}).`)
    console.log('Nada foi alterado.')
    return
  }

  await Usuario.create({
    nome: NOME,
    email: EMAIL,
    senhaHash: await criptografarSenha(SENHA),
    papel: PAPEIS.SUPERADMIN,
    lojaId: null,
  })

  console.log('Superadmin criado:')
  console.log(`  e-mail: ${EMAIL}`)
  console.log(`  senha:  ${SENHA}`)
  console.log('Troque a senha depois do primeiro login.')
}

main()
  .catch((erro) => {
    console.error('Erro ao criar superadmin:', erro.message)
    process.exitCode = 1
  })
  .finally(() => desconectarBanco())
