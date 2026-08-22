# ConvoTalk

Full-stack real-time chat application built with the MERN stack, Socket.IO and WebRTC.

[![CI]](https://github.com/slowdroph/chat-app/actions/workflows/ci.yml)
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

## Architecture

```text
├── client/   React SPA (Vite + TypeScript + Tailwind CSS v4)
├── server/   REST API + Socket.IO + WebRTC signaling (Express + TypeScript)
└── shared/   Type contracts shared between client and server
```

Message flow:

```text
Client → Socket.IO event → auth middleware → Zod validation
       → room authorization → message service → MongoDB persist
       → broadcast to room participants
```

Messages are persisted before broadcast, ordered by database timestamps, and deduplicated through a unique index on `(senderId, clientMessageId)`.

## API Reference

Summary of the main REST endpoints (all authenticated routes require a Bearer access token):

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account |
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
| GET | `/api/users/search?q=` | Search users |
| GET | `/api/health` | Readiness probe |

Real-time communication runs over Socket.IO with explicit event names (`message`, `typing`, `read_messages`, `call:initiate`, `webrtc:offer`, etc.), all payloads validated with Zod schemas.

## Deployment

The project ships with deployment configurations for multiple platforms:

- **Docker Compose** — local orchestration of MongoDB, the API server and the Nginx-served client
- **Railway** — backend deployment via Nixpacks (`railway.json`, `nixpacks.toml`)
- **Netlify** — frontend hosting with API/WebSocket proxying (`netlify.toml`)
- **GitHub Actions** — CI pipeline running server tests, client lint/build/tests and Playwright end-to-end tests

Both Dockerfiles are multi-stage builds running as non-root users; the production Nginx image handles SPA fallback, gzip, API proxying and WebSocket upgrades.

## Security

- Access (15 min) and refresh (7 days) tokens, refresh stored hashed and delivered via httpOnly cookies
- bcrypt password hashing
- Six dedicated REST rate limiters plus per-socket, per-room and per-IP limits on socket events
- Zod validation on every REST endpoint and Socket.IO event
- SSRF-hardened link previews: DNS resolution pinning, private IP rejection, redirect limits and response caching
- Helmet security headers and origin-restricted CORS
- Regex escaping on user-provided search input to prevent ReDoS/injection
- Structured audit logging for authentication, moderation and account actions
- Startup validation of environment variables (secret length, URL formats)
- Upload restrictions by MIME type and size

## License

Released under the [MIT License](LICENSE).
