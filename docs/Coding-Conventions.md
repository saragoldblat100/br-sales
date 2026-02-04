# Coding Conventions

## TypeScript
- Strict mode enabled across client, server, and shared
- Prefer typed responses and shared types from @bravo/shared
- Use path aliases (see tsconfig paths)

## Shared Schemas and Types
- Define validation in shared/src with Zod
- Export inferred types (z.infer<...>) for reuse
- Keep request/response payloads aligned with these types

## API Response Shape
Expected envelope:
- Success: { success: true, data, message? }
- Error: { success: false, error: { code, message, details? } }

If an endpoint returns a different shape, update both server and client to be consistent.

## Error Handling
- Throw AppError for expected application errors
- Let validate middleware handle Zod validation errors
- Use asyncHandler for async controllers

## Frontend Patterns
- Hooks wrap API access and are kept in features/<feature>/api
- UI components are in features/<feature>/components
- Pages in client/src/pages should be thin composition layers

## Styling
- Tailwind CSS with semantic utility classes in index.css
- Use .btn, .card, .form-input, etc. for consistency
- Prefer design tokens (primary, secondary, success, danger)

## Naming
- Files: kebab or dot separated by feature (e.g., auth.api.ts)
- Components: PascalCase
- Hooks: useX
- Schemas: <name>Schema

## Localization Notes
- The UI contains Hebrew strings and RTL layout in multiple components.
- When adding new UI, follow existing text direction and labeling patterns.
