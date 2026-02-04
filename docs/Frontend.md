# Frontend Guide

## Tech Stack
- React 18 + TypeScript
- Vite dev server and build
- React Router v6
- React Query for server-state caching
- Axios for HTTP requests
- Tailwind CSS with a custom theme
- lucide-react icons

## Entry and Composition
- client/src/main.tsx renders the app with Providers and AppRouter.
- client/src/app/providers.tsx wraps:
  - QueryClientProvider (React Query)
  - BrowserRouter (React Router)
- client/src/app/router.tsx defines routes and a ProtectedRoute wrapper.

## Strict Layering (UI / Logic / Containers)
The client enforces a strict separation:
- ui/ — presentational components only (JSX + styles)
- logic/ — hooks and state management
- containers/ — wire logic to UI and pass props

UI components must not fetch data, manage state, or perform side effects.
All data access and state updates live in logic/ or containers/.

## Routing
Public:
- /login

Protected:
- / (Dashboard)
- /customers
- /items
- /orders

The ProtectedRoute uses useAuth() to gate access and redirect to /login.

## Auth Flow (Client)
- Token stored in localStorage (authToken)
- Axios request interceptor adds Authorization header
- Axios response interceptor handles 401 by clearing token and redirecting to /login
- useAuth() exposes login/logout and role helpers

Key files:
- client/src/shared/lib/api.ts
- client/src/features/auth/api/*
- client/src/features/auth/hooks/useAuth.ts

## Feature Organization
Features are grouped by domain under client/src/features with the strict layering:
- auth
  - ui, logic, containers
  - api, hooks
- customers
  - ui, logic, containers
  - api
- items
  - ui, logic, containers
  - api
- orders
  - ui, logic, containers
  - api
- sales
  - ui, logic, containers

Pages live in client/src/pages with the same ui/logic/containers layout.
Shared layout components follow the same pattern under client/src/shared/layout.

## Data Fetching with React Query
- Query keys are centralized in each feature's *queries.ts
- Caching and refetch settings are defined per query
- Mutations update or invalidate caches

## UI and Styling
- Tailwind CSS with custom theme tokens in client/tailwind.config.js
- SCSS Modules co-located with UI components (e.g., Component.module.scss)
- No global UI utility classes in index.css beyond base styles
- Layout components are now in client/src/shared/layout with ui/logic/containers

## Adding a New Feature (Recommended Pattern)
1) Create API functions in client/src/features/<feature>/api
2) Add query hooks in client/src/features/<feature>/api/<feature>.queries.ts
3) Build UI in client/src/features/<feature>/ui with a co-located .module.scss
4) Add logic hooks in client/src/features/<feature>/logic
5) Add containers in client/src/features/<feature>/containers
6) Add a page in client/src/pages (ui/logic/containers) if needed
7) Wire route in client/src/app/router.tsx

## Common Pitfalls
- Ensure API responses match the shared envelope (success/data)
- Keep query keys stable to avoid cache collisions
- Use shared types from @bravo/shared for request/response payloads
