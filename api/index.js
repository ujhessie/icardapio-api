// Porta de entrada da Vercel.
//
// Fora da Vercel o sistema roda como servidor normal (src/server.js, com
// app.listen e Socket.io). Aqui a Vercel chama esta função a cada requisição,
// então não existe porta escutando: só entregamos o app do Express pronto.
import { app } from '../src/app.js'
import { conectarBanco } from '../src/config/db.js'

// As rotas vivem todas sob /api. A Vercel entrega a URL já reescrita; quando
// ela chega sem o prefixo (ex: /publico/demo-pizzaria), recolocamos.
function comPrefixoApi(url) {
  if (url.startsWith('/api')) return url
  return url.startsWith('/') ? `/api${url}` : `/api/${url}`
}

export default async function handler(req, res) {
  try {
    await conectarBanco()
  } catch (erro) {
    console.error('Falha ao conectar no banco:', erro.message)
    res.status(503).json({ erro: 'Banco indisponível no momento. Tente de novo.' })
    return
  }

  req.url = comPrefixoApi(req.url || '/')

  return app(req, res)
}
