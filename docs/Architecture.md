# Architecture

## Overview
Bravo Sales is a monorepo with three workspaces:
- client: React + Vite frontend
- server: Express + MongoDB backend
- shared: Zod schemas and TypeScript types shared by client and server

This structure keeps API contracts in one place (shared) while allowing frontend and backend to evolve together.

## High-Level Data Flow
1) Client requests data via Axios at /api/*.
2) During development, Vite proxies /api to http://localhost:5001 (server).
3) Server validates input (Zod), runs business logic, and returns JSON responses.
4) Client caches responses with React Query and renders UI.

## Packages and Responsibilities
- client
  - UI, routing, auth state, React Query caching
  - Uses shared schemas/types for API payloads
- server
  - Express app, middleware, auth, database, error handling
  - Uses shared schemas/types for request validation and response shapes
- shared
  - Zod schemas and inferred types for auth, users, orders, items, customers, categories, and API responses

## Authentication and Authorization
- JWT-based auth
- Client stores the token in localStorage under authToken
- Axios request interceptor adds Authorization: Bearer <token>
- Server middleware verifies JWT and attaches user info to req.user
- Role checking is available via authorize() middleware (not heavily used yet)

## Error Handling and Response Envelope
Expected response shapes:
- Success: { success: true, data: ..., message?: string }
- Error: { success: false, error: { code, message, details? } }

Server uses a centralized error handler to normalize errors into this envelope. Client uses a response interceptor to convert errors into thrown Error objects with a readable message.

## Security and Middleware
Server middleware includes:
- helmet for HTTP security headers
- cors with explicit allow list
- express-rate-limit for abuse prevention
- JSON/body parsers with size limits

## Environment and Configuration
Server uses .env values validated via Zod at startup. See server/.env.example for required keys:
- PORT
- NODE_ENV
- MONGODB_URI
- JWT_SECRET, JWT_EXPIRES_IN
- CLIENT_URL
- RATE_LIMIT_* settings

## Current Implementation Scope
- Auth flows are fully implemented on the server.
- Other domain routes (customers/items/orders/categories) are present in the client but are not yet implemented on the server (see TODOs in server/src/app.ts).

## Shared Schema Strategy
- Zod schemas live in shared/src and are compiled to shared/dist.
- Types are inferred from Zod and imported by both client and server.
- This keeps API contracts consistent across the stack.
