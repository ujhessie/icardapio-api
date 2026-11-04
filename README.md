# iCardápio — API

API do **iCardápio**: cardápio digital e gestão de pedidos para restaurantes, multi-loja.
Node + Express + MongoDB Atlas, autenticação JWT.

- Site: https://icardapio.vercel.app
- API: https://icardapio-api.vercel.app/api
- Saúde: https://icardapio-api.vercel.app/api/saude

## Rodando na sua máquina

```bash
npm install
copy .env.example .env     # preencha MONGODB_URI e JWT_SEGREDO
npm run dev                # http://localhost:4000/api
```

O front roda separado, no repositório `icardapio-front`.

## Deploy

Push no `main` → a Vercel faz o deploy sozinho.

Na Vercel a API roda como **função serverless** (`api/index.js`), não como servidor.
Por isso:

- não existe porta escutando nem Socket.io — a atualização de tela é por polling
- a conexão com o Mongo é reaproveitada entre acessos (`src/config/db.js`)

## Variáveis de ambiente

| Variável | Para que serve |
|---|---|
| `MONGODB_URI` | string de conexão do Atlas |
| `JWT_SEGREDO` | segredo que assina os tokens |
| `JWT_EXPIRA_EM` | validade do token (padrão `7d`) |
| `URL_FRONT` | origem liberada no CORS (sem barra no fim) |
| `PORTA` | só local; na Vercel a plataforma define |

## Documentação

- [Arquitetura](docs/arquitetura.md)
- [Modelo de dados](docs/modelo-de-dados.md)
- [Rotas da API](docs/rotas-api.md)
- [Decisões](docs/decisoes.md)
- [Guia do projeto](AGENTS.md)
