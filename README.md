# ConvoTalk — MERN Real-Time Chat

Aplicação de chat em tempo real construída com React, TypeScript, Tailwind CSS, Node.js, Express, MongoDB (Mongoose), Socket.IO e autenticação JWT.

## Estrutura

```text
client/   Aplicação React (Vite + TypeScript + Tailwind)
server/   API REST + Socket.IO (Express + TypeScript + MongoDB)
shared/   Tipos compartilhados entre client e server
```

## Requisitos

- Node.js 18+
- MongoDB (local ou Atlas)
- Conta no [Resend](https://resend.com) para envio de e-mails
- Conta no [Cloudinary](https://cloudinary.com) para upload de arquivos (opcional)

## Configuração

1. Copie `server/.env.example` para `server/.env` e preencha as variáveis.

```text
PORT=3001
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/?appName=AppName
JWT_SECRET=
REFRESH_TOKEN_SECRET=
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=
COOKIE_SECURE=true
EMAIL_FROM=ConvoTalk <onboarding@resend.dev>
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
LOG_LEVEL=info
```

> `JWT_SECRET` e `REFRESH_TOKEN_SECRET` devem ter pelo menos 32 caracteres e serem diferentes em produção.
> `COOKIE_SECURE=false` deve ser usado apenas quando o frontend acessar o backend via HTTP (ex.: docker-compose local).
> `CORS_ORIGINS` aceita origens adicionais separadas por vírgula. `CLIENT_URL` é sempre permitida.

2. Instale as dependências.

```bash
npm install --prefix server
npm install --prefix client
```

3. Suba os serviços.

```bash
npm run dev --prefix server
npm run dev --prefix client
```

4. Acesse `http://localhost:5173`.

## Scripts

| Diretório | Comando         | Descrição               |
| --------- | --------------- | ----------------------- |
| server    | `npm run dev`   | Servidor com hot reload |
| server    | `npm run build` | Compilação TypeScript   |
| server    | `npm start`     | Executa o build         |
| server    | `npm test`      | Testes (Vitest)         |
| client    | `npm run dev`   | Frontend com hot reload |
| client    | `npm run build` | Build de produção       |
| client    | `npm run lint`  | Lint (ESLint)           |
| client    | `npm test`      | Testes (Vitest)         |

## Docker Compose

O `docker-compose.yml` sobe MongoDB, server e client para ambiente local.

## Segurança

- Autenticação JWT com access e refresh tokens em cookies.
- Validação de entrada com Zod em rotas REST e eventos Socket.IO.
- Rate limiting por endpoint.
- Headers seguros via Helmet, CORS restrito e proteção contra SSRF no preview de links.
- `clientMessageId` garante idempotência no envio de mensagens.

## Produção

- Nunca commite o arquivo `.env`.
- Preencha `CLIENT_URL` (e `CORS_ORIGINS`, se houver mais de um frontend).
- Use HTTPS e `COOKIE_SECURE=true` para que os cookies funcionem.
- Defina `NODE_ENV=production`.
