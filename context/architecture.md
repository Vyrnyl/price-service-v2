# Architecture

## 1. Overview

PresyoSerbisyo is built as a modular, scalable web application with a clear separation between frontend presentation, backend business logic, data access, and shared infrastructure.

The system supports:
- Role-scoped field data capture — officers record prices and see only their own records
- Automatic SRP compliance classification at write time
- Time-series forecasting over historical price data
- Multi-format report generation (PDF/XLSX/CSV) with server-side file storage
- Unauthenticated public read access to price transparency data

> **This document describes the target structure** — the standard the codebase is being refactored toward. Outstanding gaps are tracked in [progress.md](progress.md) → Blockers; the work to close them is planned in [build-plan.md](build-plan.md) Phases R1–R3.

---

## 2. Architectural Goals

- Modular domain-based structure for easy maintenance and scaling
- Clear separation of concerns between frontend and backend
- Centralized shared services for authentication, errors, logging, and validation
- Reusable API patterns for all modules
- Secure and role-based access control
- Support for future expansion

---

## 3. Overall System Architecture

### 3.1 Frontend
- Next.js 16 (App Router) · React 19
- TypeScript strict
- Tailwind CSS v4 with Material 3 tokens ([ui-rules.md](ui-rules.md))
- Feature-based module organization
- Centralized API services and shared UI components

### 3.2 Backend
- Node.js · Express 4 · TypeScript strict
- PostgreSQL · Prisma 7 (`@prisma/adapter-pg`)
- JWT authentication (httpOnly cookie or Bearer header)
- Modular domain services and repositories

### 3.3 Shared Infrastructure
- Authentication middleware
- Role-based access control middleware
- Validation layer (Zod)
- Error handling layer
- Logging and audit support
- Database access layer (Prisma singleton)

### 3.4 Deployment Topology
- **Frontend** — Vercel (`price-service-sandy.vercel.app`)
- **Backend** — Node process, CORS-allowlisted to the Vercel origin and `localhost:3000`
- **Database** — PostgreSQL via `DATABASE_URL`
- **Generated reports** — written to `backend/reports/`, served at `/reports/files` as static assets

> Report files live on the backend's local disk and do not survive an ephemeral redeploy. Object storage is the eventual fix — tracked in [progress.md](progress.md) → Open Decisions.

---

## 4. Backend Architecture

### 4.1 Core Backend Structure

```text
src/
├── app.ts                  # express app assembly (no listen)
├── server.ts               # boot + listen
├── config/
│   └── env.ts              # typed, validated environment schema
├── shared/
│   ├── handlers/
│   │   ├── asyncHandler.ts
│   │   └── errorHandler.ts
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   └── authorize.ts
│   ├── utils/
│   ├── constants/
│   └── types/
├── modules/
│   ├── auth/
│   ├── user/
│   ├── commodity/
│   ├── srp/
│   ├── store/
│   ├── price-record/
│   ├── report/
│   ├── forecast/
│   └── public/
└── prisma.ts
```

### 4.2 Singleton Handlers

The backend uses singleton-style shared handlers for common request-flow concerns:

- **Singleton async handler** — wraps controller methods and ensures consistent error propagation; prevents duplicate async wrappers across modules.
- **Singleton error handler** — centralizes HTTP error formatting and response handling; ensures consistent error messages for API clients. Maps `AppError`, `ZodError`, and Prisma codes (`P2002` → 409, `P2025` → 404); everything else becomes a generic 500 that leaks nothing.

These live in the shared infrastructure layer and are reused by all modules.

Failure response envelope:

```json
{ "success": false, "message": "…", "errors": [] }
```

### 4.3 Backend Module Pattern

Each domain module follows a consistent structure:

```text
modules/
└── price-record/
    ├── price-record.controller.ts
    ├── price-record.service.ts
    ├── price-record.repository.ts
    ├── price-record.routes.ts
    ├── price-record.schema.ts      # Zod request/DTO schemas (also the validator)
    ├── price-record.types.ts
    ├── price-record.scope.ts       # role-scoping helper, where applicable
    └── index.ts
```

`.validator.ts` is **merged into `.schema.ts`** for this project — Zod schemas serve as both shape and validator, and splitting them produces two files that always change together. A domain-specific `.middleware.ts` is added only when a module actually needs one; none currently do.

### 4.4 Module Responsibilities

- **Controller** — handles HTTP requests and responses; parses via schema, delegates to service
- **Service** — business logic
- **Repository** — database access
- **Routes** — route definitions and middleware attachment (`authenticate`, `authorize`)
- **Validator** — merged into Schema (see §4.3)
- **Schema** — Zod validation and DTO structure
- **Types** — TypeScript interfaces/types
- **Middleware** — domain-specific middleware
- **Scope** — pure functions computing role-based query filters; independently unit-tested

---

## 5. Frontend Architecture

### 5.1 Frontend Structure

```text
src/
├── app/
│   ├── (auth)/login/
│   ├── (protected)/admin/
│   ├── (protected)/officer/
│   ├── (public)/
│   └── api/                # Next.js BFF proxy layer
├── features/
│   ├── auth/
│   ├── admin/
│   ├── commodity/
│   ├── dashboard/
│   ├── officer/
│   └── public/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── mocks/
│   ├── utils/
│   └── types/
└── styles/
```

### 5.2 Frontend Module Pattern

```text
features/
└── officer/
    ├── components/
    ├── hooks/
    ├── pages/
    ├── services/
    ├── types/
    └── index.ts
```

> **Naming rule — `store` is ambiguous in this domain.** A *store* here is a retail establishment, not a state container. The retail-store domain therefore lives in **`stores/`** (plural, matching the `/api/stores` endpoint). The singular `store/` folder is reserved for state management and is currently unused — this app holds state in React local state and hooks, with no global store library.

### 5.3 Frontend Responsibilities

- **Pages** — route-level UI screens
- **Components** — reusable UI building blocks ([ui-registry.md](ui-registry.md))
- **Hooks** — state and side-effect logic
- **Services** — API requests and data fetching; **no `fetch` inside components**
- **Store** — global or feature state (unused; see §5.2)
- **Types** — domain models and request/response shapes

### 5.4 The BFF Proxy Layer

`src/app/api/` is the frontend's own namespace, **not** the backend contract. It exists so the httpOnly `accessToken` cookie can be attached as an `Authorization: Bearer` header server-side, keeping the token out of client JavaScript.

```text
browser → /api/stores            (Next route handler)
        → attaches Bearer token from cookie
        → http://backend/api/v1/stores
```

`app/api/[...path]/route.ts` is a catch-all pass-through; `app/api/auth/*` are explicit handlers that additionally set and clear the cookie. **Backend API version changes are absorbed here** — client code keeps calling `/api/*`.

---

## 6. Domain Modules

One subsection per module from [project-overview.md](project-overview.md) → Core Modules.

### 6.1 Authentication Module

Backend:
- login (bcrypt verify → JWT issue)
- session read (`/me`)
- logout
- role-based access verification

Frontend:
- login page
- protected route handling via `middleware.ts`
- role-based navigation
- role switching (development aid)

### 6.2 User Module

Backend:
- user CRUD
- role assignment
- active/inactive toggle
- **Admin only**

Frontend:
- users management table
- add-user dialog
- search and filter controls
- user stats summary

### 6.3 Commodity Module

Backend:
- catalog CRUD — Admin write, all roles read
- public read projection

Frontend:
- commodity management table
- add-commodity and details dialogs
- summary cards
- public commodity list

### 6.4 SRP Module

Backend:
- effective-dated SRP CRUD — Admin write
- supplies the reference value for compliance checks

Frontend:
- update-SRP dialog within the commodity feature

### 6.5 Store Module

Backend:
- store registry CRUD
- officer ownership
- `lastVisited` tracking

Frontend:
- store registry grid, cards, header, toolbar
- create-store dialog
- per-store price records modal

### 6.6 Price Record Module

Backend:
- CRUD over field-captured observations
- SRP comparison producing `PriceStatus`
- officer-scoped queries

Frontend:
- price records table
- price record entry form
- filters

### 6.7 Report Module

Backend:
- generate `MONTHLY` / `SRP_COMPLIANCE` / `TREND`
- PDF/XLSX/CSV writers
- static file serving
- role-scoped listing

Frontend:
- report generation page
- report type cards
- export format buttons
- recent report cards

### 6.8 Forecast Module

Backend:
- ARIMA forecast generation
- persisted predictions with confidence values

Frontend:
- price analysis page
- trend and forecast panels
- forecast detail modal

### 6.9 Public Module

Backend:
- unauthenticated commodity listing
- unauthenticated forecast retrieval by commodity

Frontend:
- public commodity list
- public price analysis

---

## 7. API Design Principles

- RESTful routing structure
- Versioned APIs — `/api/v1`
- Consistent response format
- Centralized validation and error handling
- Standardized controller → service → repository flow
- Role-based route protection

Example:

```text
/api/v1/auth/login
/api/v1/price-records
/api/v1/price-records/:id
```

### Route map

| Mount | Auth | Routes |
|---|---|---|
| `/api/v1/auth` | public | `POST /login` · `GET /me` · `POST /logout` |
| `/api/v1/public` | public | `GET /commodities` · `GET /forecasts/:commodityId` |
| `/api/v1/users` | Admin | `POST /` · `GET /` · `GET /:id` · `PUT /:id` · `DELETE /:id` |
| `/api/v1/commodities` | read: all · write: Admin | full CRUD |
| `/api/v1/srps` | read: all · write: Admin | full CRUD |
| `/api/v1/stores` | Admin + Officer | full CRUD |
| `/api/v1/price-records` | Admin + Officer (own-scope) | full CRUD |
| `/api/v1/reports` | Admin + Officer (own-scope) | CRUD + `DELETE /` bulk |
| `/api/v1/forecasts` | Admin + Officer | `POST /generate` + CRUD |

Everything under `/api/v1` except `auth` and `public` sits behind `authenticate`.

---

## 8. Security Architecture

- Role-based access control (RBAC)
- JWT access tokens signed with `JWT_SECRET`, delivered as an httpOnly cookie
- Protected routes and middleware
- Password hashing with bcrypt and secure storage
- Audit logging for critical actions
- Request validation on both frontend and backend

### RBAC matrix

| Capability | Admin | Officer | Public |
|---|:--:|:--:|:--:|
| Manage users & roles | ✅ | ❌ | ❌ |
| Manage commodities / SRP | ✅ | read | read |
| Register stores | ✅ | ✅ | ❌ |
| Record prices | ✅ | ✅ | ❌ |
| View **all** price records | ✅ | own only | ❌ |
| Generate reports | ✅ | own scope | ❌ |
| View public price data | ✅ | ✅ | ✅ |

### Two-layer enforcement model

Both layers are required:

1. **Route-level `authorize(...roles)` middleware** — the coarse gate. Rejects a wrong-role caller with 403 before any handler runs.
2. **Service-level scoping** (`*.scope.ts`) — the fine gate. An authorized Officer must still only *see their own rows*, which a route guard cannot express. These are pure functions and are unit-tested.

Never substitute one for the other. A route guard without scoping leaks other officers' data; scoping without a route guard lets the wrong role reach the handler.

---

## 9. Data Flow

**The golden path.** Every feature follows it; [debug](../.claude/skills/debug/SKILL.md) traces bugs along it.

1. User interacts with the frontend UI
2. Frontend sends a request through a feature service
3. Backend route receives the request (`authenticate` → `authorize`)
4. Controller delegates to the service layer
5. Service uses the repository layer for data access
6. ORM interacts with the database
7. Response returns through shared handlers
8. Frontend displays updated state

---

## 10. Recommended Implementation Strategy

Phasing lives in [build-plan.md](build-plan.md) — Phases R1–R3 cover the standards refactor, Phases 1+ cover remaining product work.

---

## 11. Summary

This architecture keeps the system modular, secure, scalable, and easy to maintain. Separating modules across frontend and backend lets each domain evolve independently while sharing common infrastructure — authentication, validation, error handling, and API standards. The two-layer RBAC model (§8) is the defining security pattern and must be preserved in every new module.
