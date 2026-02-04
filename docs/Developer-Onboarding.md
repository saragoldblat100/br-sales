# Developer Onboarding

## Prerequisites
- Node.js >= 20
- npm (comes with Node)
- MongoDB connection string (cloud or local)

## Repository Layout
- client: React frontend (Vite)
- server: Express API
- shared: shared Zod schemas and types

## Install Dependencies
From the repo root:
- npm install

This installs dependencies for all workspaces.

## Configure Environment
1) Copy server/.env.example to server/.env
2) Update values:
   - MONGODB_URI
   - JWT_SECRET (min 32 chars)
   - CLIENT_URL (usually http://localhost:5174)

## Run in Development
From the repo root:
- npm run dev

This runs:
- client on http://localhost:5174
- server on http://localhost:5001

Vite proxies /api requests to the server.

## Build
- npm run build

## Lint
- npm run lint

## Tests
- npm run test
- npm run test:run

## Common Tasks
- Add a new API schema: edit shared/src and run shared build if needed
- Add a new server route: create feature folder, wire in app.ts
- Add a new screen: create page, add route, build components in features

## Troubleshooting
- If the client shows 401, clear localStorage authToken and re-login
- If server fails on startup, check env validation errors in console
- If MongoDB does not connect, verify MONGODB_URI and network access

## Suggested First Changes
- Implement missing /sales routes on the server
- Align API response shapes across client/server
- Add tests for auth and data validation
