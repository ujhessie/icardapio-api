import 'dotenv/config'

const env = {
  porta: Number(process.env.PORTA || process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI,
  jwtSegredo: process.env.JWT_SEGREDO,
  jwtExpiraEm: process.env.JWT_EXPIRA_EM || '7d',
  urlFront: process.env.URL_FRONT || 'http://localhost:5173',
  producao: process.env.NODE_ENV === 'production',
}

// Falha cedo e com mensagem clara se faltar configuração.
const obrigatorias = {
  MONGODB_URI: env.mongoUri,
  JWT_SEGREDO: env.jwtSegredo,
}

for (const [nome, valor] of Object.entries(obrigatorias)) {
  if (!valor) {
    throw new Error(`Variável de ambiente faltando: ${nome} (veja o .env.example)`)
  }
}

export { env }
