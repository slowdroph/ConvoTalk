# ConvoTalk

Full-stack real-time chat application built with the MERN stack, Socket.IO and WebRTC.

[![CI](https://github.com/slowdroph/chat-app/actions/workflows/ci.yml/badge.svg)](https://github.com/slowdroph/chat-app/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)

[Live Demo](https://convotalk.live) · [Report a Bug](https://github.com/slowdroph/chat-app/issues)

---

## Overview

ConvoTalk is a production-grade chat platform featuring real-time messaging with delivery guarantees, one-to-one audio/video calls via WebRTC, group management, file sharing and PDF conversation export. The entire stack — client, server and shared contracts — is written in strict TypeScript, with validation at every boundary (REST and Socket.IO), layered rate limiting and structured audit logging.

## Features

### Authentication & User Management

- Email/password registration with email verification (branded HTML emails via Resend)
- JWT authentication with short-lived access tokens and refresh tokens in httpOnly cookies
- Password reset flow with hashed, expiring tokens
- Profile management: name, custom status, avatar upload/removal
- Block/unblock users
- Account deletion with cleanup of stored media and messages

### Real-Time Messaging

- Instant messaging over Socket.IO with acknowledgment-based delivery
- Optimistic UI updates with client-generated message IDs for idempotent sends (no duplicates on reconnect or retry)
- Message editing and deletion (for everyone / for me)
- Emoji reactions
- Message threading with a dedicated thread panel
- Pinned messages (up to 10 per conversation)
- Read receipts
- Typing indicators with auto-timeout
- Online presence tracking across multiple devices
- Global cross-conversation search and per-conversation search
- Server-side link previews with SSRF protection
- Cursor-based pagination for message history
- Offline message queue backed by IndexedDB

### Audio/Video Calls

- One-to-one audio and video calls in direct conversations
- Full call lifecycle: initiate, incoming, accept, reject, end
- WebRTC signaling handled server-side through Socket.IO
- Mute/unmute and camera toggle during calls
- STUN/TURN configuration support

### Conversations & Groups

- Direct conversations and group chats
- Group administration: rename, description, member and admin management, group avatar
- System messages for membership and moderation events
- Unread message counts per conversation

### Media & Export

- File attachments (images, PDFs, audio, text) up to 5 per message, stored on Cloudinary
- In-browser audio message recording
- Conversation export to PDF via streaming generation

### Interface & Experience

- Dark/light theme with persistence
- Virtual scrolling for large message lists
- Lazy-loaded routes with code splitting
- Keyboard shortcuts (Ctrl+K search, Ctrl+N new group)
- Touch gestures for mobile (long press, swipe actions)
- Responsive, mobile-first layout
- Loading skeletons, error boundaries and toast notifications
- Progressive Web App: installable, service worker, offline-ready shell
- Landing page with a live interactive preview chat

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7, Axios |
| Real-time | Socket.IO 4 (client and server) |
| Backend | Node.js, Express 5, TypeScript |
| Database | MongoDB with Mongoose 9 |
| Validation | Zod (REST endpoints and socket events) |
| Auth | JSON Web Tokens, bcryptjs |
| Media & Email | Cloudinary, Multer, Resend |
| Documents | PDFKit (streaming export) |
| Observability | Pino structured logging, health/readiness endpoints |
| Testing | Vitest, Supertest, MongoDB Memory Server, Playwright |
| Infrastructure | Docker, Docker Compose, Nginx, GitHub Actions CI |

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [MongoDB](https://www.mongodb.com/) 7+ (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- [npm](https://www.npmjs.com/) (comes with Node)
- [Docker](https://www.docker.com/) and Docker Compose (optional, for containerized setup)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/slowdroph/chat-app.git
cd chat-app
```

### 2. Install dependencies

```bash
# Client
cd client && npm install

# Server
cd ../server && npm install
```

### 3. Configure environment variables

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your own values. See [Environment Variables](#environment-variables) for the full reference.

At minimum, set:

```
MONGO_URI=mongodb://localhost:27017/convotalk
JWT_SECRET=<any-random-string-32-chars-min>
REFRESH_TOKEN_SECRET=<different-random-string>
CLIENT_URL=http://localhost:5173
```

### 4. Run the application

#### Option A: Docker Compose (recommended)

```bash
docker compose up
```

This starts MongoDB, the API server and the Nginx-served client. The client will be available at `http://localhost:8080`.

#### Option B: Manual (development)

In two separate terminals:

```bash
# Terminal 1 — Server (API + Socket.IO)
cd server
npm run dev
# Runs on http://localhost:3001

# Terminal 2 — Client (Vite dev server)
cd client
npm run dev
# Runs on http://localhost:5173
```

The Vite dev server automatically proxies `/api` and `/socket.io` requests to the backend.

## Environment Variables

All server environment variables are defined in `server/.env.example`. The server validates required variables at startup and will refuse to start if they are missing.

### Required

| Variable | Description | Example |
| --- | --- | --- |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/convotalk` |
| `JWT_SECRET` | Secret for signing access tokens (min 32 chars in production) | `your-secure-random-string` |
| `REFRESH_TOKEN_SECRET` | Secret for refresh tokens (must differ from `JWT_SECRET` in production) | `your-refresh-secret` |
| `CLIENT_URL` | Frontend URL for CORS and email links | `http://localhost:5173` |

### Optional

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Server listening port | `3001` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (enables image uploads) | — |
| `CLOUDINARY_API_KEY` | Cloudinary API key | — |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | — |
| `RESEND_API_KEY` | Resend API key (enables email verification and password reset) | — |
| `VAPID_PUBLIC_KEY` | Web Push public key (enables push notifications) | — |
| `VAPID_PRIVATE_KEY` | Web Push private key | — |
| `VAPID_SUBJECT` | Web Push subject | `mailto:admin@convotalk.com` |
| `COOKIE_SECURE` | Set secure flag on cookies | `false` |
| `COOKIE_SAMESITE` | SameSite cookie policy | `lax` |
| `CORS_ORIGINS` | Extra CORS origins (comma-separated) | — |
| `EMAIL_FROM` | Sender email address for Resend | `ConvoTalk <noreply@convotalk.live>` |
| `LOG_LEVEL` | Pino log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`) | `info` |

## Project Structure

```text
├── client/              React SPA (Vite + TypeScript + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/  UI components (Auth, Chat, Home, Settings, Sidebar, Skeletons, ui)
│   │   ├── contexts/    React contexts (Auth, Socket, Theme, Toast)
│   │   ├── hooks/       Custom hooks (useAuth, useChatSocket, useWebRTC, etc.)
│   │   ├── lib/         Utilities (API URL builder, IndexedDB offline storage)
│   │   ├── pages/       Route pages (Chat, Home, Login, Settings, etc.)
│   │   ├── providers/   Context providers
│   │   ├── services/    API client and push notification service
│   │   ├── types/       Re-exports from @shared/types
│   │   └── utils/       Formatting, error handling, sounds
│   ├── e2e/             Playwright end-to-end tests
│   └── public/          Static assets, manifest, service worker
│
├── server/              REST API + Socket.IO + WebRTC signaling (Express + TypeScript)
│   └── src/
│       ├── config/      Environment validation, database, Cloudinary, logger
│       ├── controllers/ Request handlers
│       ├── middleware/   Auth, rate limiting, validation, error handling, uploads
│       ├── models/      Mongoose schemas (User, Room, Message, Session, ReadLog, PushSubscription)
│       ├── routes/      Express route definitions
│       ├── services/    Business logic (auth, messages, rooms, export, email, etc.)
│       ├── socket/      Socket.IO event handlers (messaging, typing, read, pin, WebRTC)
│       ├── utils/       Audit logging, SSRF protection, regex, room auth
│       └── validations/ Zod schemas for REST and Socket.IO payloads
│
├── shared/              Type contracts and utilities shared between client and server
│   ├── types.ts         API payloads, socket events, database entities
│   └── mentions.ts      Mention token parsing
│
├── design/              UI mockups (HTML + PNG)
└── docker-compose.yml   Local orchestration (MongoDB + Server + Client)
```

## Architecture

```text
Client → Socket.IO event → auth middleware → Zod validation
       → room authorization → message service → MongoDB persist
       → broadcast to room participants
```

Messages are persisted before broadcast, ordered by database timestamps, and deduplicated through a unique index on `(senderId, clientMessageId)`.

The client and server share type contracts via `@shared/*` path alias, ensuring type safety across the entire stack without duplication.

## Development

### Available Scripts

| Location | Command | Description |
| --- | --- | --- |
| Root | `npm run client` | Start the client dev server |
| Root | `npm run server` | Start the server dev server |
| Client | `npm run dev` | Start Vite dev server (port 5173) |
| Client | `npm run build` | Type-check and build for production |
| Client | `npm run lint` | Run ESLint |
| Client | `npm run preview` | Preview the production build |
| Server | `npm run dev` | Start server with nodemon (auto-reload) |
| Server | `npm run build` | Compile TypeScript |
| Server | `npm run start` | Run the compiled server |

### Code Quality

- **TypeScript** strict mode on both client and server
- **ESLint** for the client (flat config)
- **Zod** validation on every REST endpoint and Socket.IO event

## Testing

### Unit & Integration Tests

The project uses [Vitest](https://vitest.dev/) on both client and server.

```bash
# Server tests (integration tests with MongoDB Memory Server)
cd server
npm test

# Client tests (component and hook tests with jsdom)
cd client
npm test

# With coverage
cd client
npx vitest run --coverage
```

### End-to-End Tests

E2E tests use [Playwright](https://playwright.dev/) with Chromium.

```bash
cd client
npx playwright install --with-deps chromium
npx playwright test
```

Playwright auto-starts the server (port 3100) and the Vite dev server (port 5174) before running tests.

### CI Pipeline

The GitHub Actions CI workflow (`.github/workflows/ci.yml`) runs three jobs on push/PR to `main`:

1. **Server** — install, build, test (with MongoDB 7 service)
2. **Client** — install, lint, build, test with coverage
3. **E2E** — install both, Playwright tests

## API Reference

All authenticated routes require a Bearer access token in the `Authorization` header.

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account (generic response, no account oracle) |
| POST | `/api/auth/login` | Authenticate |
| POST | `/api/auth/refresh` | Rotate access token |
| GET | `/api/messages/:roomId` | Paginated message history |
| GET | `/api/messages/search?q=` | Global message search |
| POST | `/api/messages/:roomId/attachments` | Upload attachments |
| GET | `/api/messages/:roomId/export` | Export conversation as PDF |
| GET | `/api/rooms` | List conversations with unread counts |
| POST | `/api/rooms/direct` | Start/get a direct conversation |
| POST | `/api/rooms/group` | Create a group |
| PUT | `/api/user/profile` | Update profile |
| POST | `/api/user/:id/block` | Block a user |
| GET | `/api/users/search?q=` | Search users by name or #publicId (min 3 chars, email search disabled) |
| GET | `/api/health` | Readiness probe |

Real-time communication runs over Socket.IO with explicit event names (`message`, `typing`, `read_messages`, `call:initiate`, `webrtc:offer`, etc.), all payloads validated with Zod schemas.

User discovery is privacy-first: search matches `name` or `#publicId` only (queries with `@` are rejected), responses and room participants expose `{_id, name, publicId, avatar, status}` — never `email`. Transactional emails (verification, password reset, already-registered notice) are sent through an in-memory queue with retry outside the request path.

## Deployment

The project ships with deployment configurations for multiple platforms:

- **Docker Compose** — local orchestration of MongoDB, the API server and the Nginx-served client (`docker-compose.yml`, `server/Dockerfile`, `client/Dockerfile`)
- **Railway** — backend deployment via Nixpacks (`railway.json`, `nixpacks.toml`)
- **Netlify** — frontend hosting with API/WebSocket proxying (`client/netlify.toml`)
- **GitHub Actions** — CI pipeline running server tests, client lint/build/tests and Playwright end-to-end tests (`.github/workflows/ci.yml`)

Both Dockerfiles are multi-stage builds running as non-root users. The production Nginx image handles SPA fallback, gzip, API proxying and WebSocket upgrades.

## Security

- Access (15 min) and refresh (7 days) tokens, refresh stored hashed and delivered via httpOnly cookies
- bcrypt password hashing
- Nine dedicated REST rate limiters (including per-user search limiting) plus per-socket, per-room and per-IP limits on socket events
- Zod validation on every REST endpoint and Socket.IO event
- SSRF-hardened link previews: DNS resolution pinning, private IP rejection, redirect limits and response caching
- Helmet security headers and origin-restricted CORS
- Regex escaping on user-provided search input to prevent ReDoS/injection
- Structured audit logging for authentication, moderation and account actions
- Startup validation of environment variables (secret length, URL formats)
- Upload restrictions by MIME type and size

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes following the existing code conventions
4. Run lint and tests before committing:
   ```bash
   # Client
   cd client && npm run lint && npm test

   # Server
   cd server && npm test
   ```
5. Commit with a descriptive message
6. Push to your fork and open a Pull Request against `main`

## License

Released under the [MIT License](LICENSE).
