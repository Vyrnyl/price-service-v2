# Code Standards

## 1. Purpose

Defines coding standards for **PresyoSerbisyo** to ensure consistency, maintainability, readability, and scalability across frontend and backend development.

Pairs with [architecture.md](architecture.md) (structure) and [ui-rules.md](ui-rules.md) (styling).

---

## 2. General Principles

- Write clean, readable, self-explanatory code
- Follow consistent naming conventions across the project
- Keep functions small and focused on a single responsibility
- Prefer reusable components, services, and utilities
- Avoid duplication of logic
- Write code that is easy to test and extend
- Use TypeScript strictly and favor strong typing
- Keep security, validation, and error handling consistent

---

## 3. Language and Runtime

### Frontend
- Next.js 16 (App Router) · React 19 · TypeScript 5 strict
- Tailwind CSS v4 (`@theme inline` tokens — no separate config file)
- `react-hook-form` + `@hookform/resolvers` + Zod
- `chart.js` / `react-chartjs-2` · `react-icons` + Material Symbols Outlined

### Backend
- Node.js · Express 4 · TypeScript 6 strict
- Prisma 7 · PostgreSQL
- Zod validation · `bcryptjs` · `jsonwebtoken`
- `pdfkit` · `exceljs` · `arima`

---

## 4. Naming Conventions

| Kind | Convention | Example |
|---|---|---|
| Files | lowercase kebab-case | `auth.service.ts`, `price-record.scope.ts` |
| React components | PascalCase `.tsx` | `UsersTable.tsx`, `StoreCard.tsx` |
| Folders | lowercase kebab-case | `price-record/`, `user-management/` |
| Variables & functions | camelCase | `priceRecord`, `getUserById()` |
| Classes & types | PascalCase | `AppError`, `UserProfile` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE`, `API_BASE_URL` |
| Environment variables | UPPER_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |
| Enum members | UPPER_SNAKE_CASE | `SRP_COMPLIANCE`, `OVERPRICE` |

### Backend module file suffixes

`<module>.controller.ts` · `.service.ts` · `.repository.ts` · `.routes.ts` · `.schema.ts` · `.types.ts` · `.scope.ts` · `.test.ts` · `index.ts`

**Always prefix with the module name.** A bare `api.ts` or `types.ts` inside a feature is not acceptable — it becomes unsearchable once open in a tab group.

### The `store` naming rule

A **store** in this domain is a *retail establishment*, not a state container. Domain code uses **`stores/`** (plural). Never name a state-management folder `store/` in this project — the collision is too confusing. See [architecture.md](architecture.md) §5.2.

---

## 5. TypeScript Standards

- Strict mode on, both workspaces
- **Avoid `any`.** Use `unknown` + narrowing at boundaries
- Prefer interfaces or type aliases for domain models
- Use enums for fixed sets of values such as roles or statuses — mirror the Prisma enums
- Keep types close to the module they belong to
- Export shared types from `shared/types` when reused broadly
- Derive types from Zod schemas rather than hand-writing duplicates:

```ts
export const createUserSchema = z.object({ /* … */ });
export type CreateUserInput = z.infer<typeof createUserSchema>;
```

### Non-null assertions

`!` is banned for environment access. `process.env.JWT_SECRET!` defers a config error to the first request instead of failing at boot. Read config through the validated env schema (§10) instead.

---

## 6. Backend Coding Standards

### 6.1 Module Structure

controller · service · repository · routes · schema · types · scope · index — see [architecture.md](architecture.md) §4.3.

### 6.2 Controller Rules
- Keep controllers thin
- No business logic inside controllers
- Parse input with the module's Zod schema, then delegate to the service
- Handle request/response mapping only
- **No role checks inline** — that is middleware's job (§6.7)

### 6.3 Service Rules
- Contain all business logic
- Keep services reusable and testable
- Avoid directly handling HTTP concerns — no `req`/`res` in a service signature

### 6.4 Repository Rules
- Encapsulate database access
- Keep repository methods focused on data operations
- **No Prisma access outside repositories**

### 6.5 Error Handling
- Use the centralized `errorHandler` — one implementation, registered last
- Use the singleton `asyncHandler` for **every** async route handler
- Do not swallow errors silently
- Throw `AppError(message, statusCode)` for expected failures
- Never leak internals — unrecognized errors become a generic 500

### 6.6 Validation
- Validate all incoming request data with Zod
- Validate params (`userIdParamSchema`) as well as bodies
- Reject invalid requests early — parse at the top of the controller

### 6.7 Authorization
- **Every protected route declares its roles** via `authorize(...)` middleware
- Never re-implement a local `requireAdmin()` helper inside a controller
- Row-level scoping belongs in a pure `*.scope.ts` function and must be unit-tested

---

## 7. Frontend Coding Standards

### 7.1 Component Rules
- Build reusable, small, focused components
- Functional components only
- Keep UI logic separate from business logic
- Use hooks for stateful behavior
- `"use client"` only where interactivity genuinely requires it

### 7.2 Page and Feature Organization
- Group related files by feature/module
- Route-level `page.tsx` files stay thin — they compose a feature page component
- Use shared components for common UI patterns

### 7.3 State Management
- Local state for simple component state
- Feature hooks for shared feature state
- No global store library is in use; do not add one without a decision entry

### 7.4 API Access
- Centralize API calls in feature service modules (`<feature>.api.ts`)
- **No direct `fetch` inside components**
- Route handlers under `src/app/api/` are the one exception — that is the BFF layer
- Go through `apiFetch` so error shape and credential handling stay uniform
- Handle loading, error, and empty states consistently

---

## 8. Code Organization Standards

### Backend
```text
src/
├── app.ts
├── server.ts
├── config/env.ts
├── modules/
│   └── price-record/
│       ├── price-record.controller.ts
│       ├── price-record.service.ts
│       ├── price-record.repository.ts
│       ├── price-record.routes.ts
│       ├── price-record.schema.ts
│       ├── price-record.types.ts
│       ├── price-record.scope.ts
│       └── index.ts
└── shared/
    ├── handlers/
    │   ├── asyncHandler.ts
    │   └── errorHandler.ts
    ├── middleware/
    ├── utils/
    ├── constants/
    └── types/
```

### Frontend
```text
src/
├── features/
│   └── officer/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       ├── types/
│       └── index.ts
└── shared/
    ├── components/
    ├── hooks/
    ├── services/
    ├── mocks/
    ├── utils/
    └── types/
```

---

## 9. Formatting Rules

- 2 spaces for indentation
- Semicolons consistently
- **Double quotes** for strings (dominant in the codebase; do not mix)
- Keep lines reasonably short and readable
- Meaningful comments only when necessary
- Import order: external packages → internal aliases (`@/…`) → relative → types

### Example

```ts
import { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncRouteHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
```

---

## 10. Security Standards

- Never hardcode secrets in source code
- Use environment variables for sensitive values, read through a **validated typed env schema that fails fast on boot**
- Hash passwords with bcrypt before storing
- **Validate permissions on every protected route** via `authorize` middleware
- Apply row-level scoping in the service layer for own-data-only roles
- Sanitize user input before processing
- Use Prisma methods (never raw string-concatenated SQL) to prevent SQL injection
- Keep JWTs in httpOnly cookies; never expose tokens to client JavaScript
- Never return `password` from any endpoint or repository projection

### Privilege-escalation rule

Any endpoint accepting a `role` field must be role-gated. An endpoint that lets a caller set their own `role` without an admin check is a privilege-escalation vulnerability, not a validation gap.

---

## 11. Testing Standards

- Write tests for business logic and critical flows
- Use meaningful test names that state the rule (`"officers only see their own reports"`)
- Test success, failure, and edge cases
- Keep tests beside the module they verify — `<module>.test.ts`
- Prefer integration tests for API flows where possible

### Runner

Node's built-in test runner via `tsx`:

```bash
npm test          # backend
```

Pure functions — scope resolvers, ARIMA math, schema validation — are the highest-value targets because they need no database.

---

## 12. Documentation Standards

- Comment complex business rules (SRP comparison thresholds, ARIMA parameters)
- Keep [progress.md](progress.md) current — it is the session-to-session handoff
- Register every new UI component in [ui-registry.md](ui-registry.md)
- Document public functions and services when necessary
- Use clear PR descriptions

---

## 13. Git and Change Management

- Descriptive commit messages — `fix: quick-ui-fix` and `TEST` are not acceptable
- Conventional prefixes: `feat:` · `fix:` · `refactor:` · `docs:` · `chore:` · `test:`
- Keep commits focused on one change or feature
- Avoid mixing unrelated updates in one commit
- Review for style, correctness, and security before merging
- **Never commit build output.** `dist/`, `.next/`, and generated `reports/*` belong in `.gitignore`
- Never commit `.env`
