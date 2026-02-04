# Backend Guide

## Tech Stack
- Node.js + TypeScript
- Express
- MongoDB with Mongoose
- JWT for authentication
- Zod for input validation

## Entry Points
- server/src/server.ts
  - Connects to MongoDB
  - Creates the Express app
  - Starts HTTP server and handles graceful shutdown

- server/src/app.ts
  - Configures middleware
  - Registers routes
  - Adds error handling

## Configuration
- server/src/config/env.ts loads and validates .env values
- server/src/config/db.ts handles MongoDB connection lifecycle

## Middleware Pipeline
1) Security: helmet
2) CORS with allow list
3) Rate limiting on /api
4) JSON and URL-encoded body parsers
5) Logger (morgan)
6) Routes
7) 404 handler
8) Global error handler

## Auth Feature (Implemented)
- server/src/features/auth
  - auth.routes.ts: endpoints and middleware
  - auth.controller.ts: HTTP layer
  - auth.service.ts: business logic
  - auth.model.ts: Mongoose schema

Endpoints:
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/change-password
- POST /api/auth/logout
- POST /api/auth/verify

## Validation
- server/src/shared/middleware/validate.ts uses Zod
- Use validateBody / validateQuery / validateParams helpers

## Error Handling
- server/src/shared/middleware/errorHandler.ts
- Normalizes errors into API envelope
- Handles AppError, ZodError, Mongoose errors, JWT errors

## Logging
- server/src/shared/utils/logger.ts
- createLogger() provides scoped logging for services

## Current Gaps (Planned)
The client references /sales/* endpoints for customers, items, and orders, but server routes are not implemented yet. app.ts includes TODOs for future feature routes.

## Adding a New Route
1) Define a schema in shared/src for validation and typing
2) Create a new feature folder under server/src/features/<feature>
3) Build route/controller/service layers
4) Add to app.ts under /api/<feature>
5) Use asyncHandler and validate middleware for consistency
