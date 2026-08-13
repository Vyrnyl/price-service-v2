# Build Plan

> **Core rule: UI-first, mock-data-first.** Every feature is built as a full, visible page using mock data and verified visually **before any logic is written**. Only then is functionality built and wired to that UI, step by step. Every feature must be visible and testable before moving to the next. **There are no invisible backend phases** — if you can't see it on screen, it isn't done.

This plan operationalizes [project-overview.md](project-overview.md), [architecture.md](architecture.md), [database-design.md](database-design.md), and [code-standards.md](code-standards.md). Visuals follow [ui-rules.md](ui-rules.md) and reuse components tracked in [ui-registry.md](ui-registry.md).

> **Note on this project's shape.** PresyoSerbisyo was built before these standards existed. Phase 0 and most product features are therefore already implemented and are documented retroactively. Phases **R0–R3** bring the existing code up to the standard; Phases **1–2** cover the product work that remains.
>
> **The Feature Loop (§1) does not apply to Phases R0–R3.** Those phases change structure, not behavior — there is no mock stage and no visual-verify gate because nothing new appears on screen. They use a **Refactor Gate** instead (§5a). The Loop applies in full to Phases 1–2.

---

## 1. How Every Feature Is Built — The Feature Loop

Apply these six steps **in order** to each feature. Do not start step N+1 until step N is verified.

| Step | Name | What happens | Gate to pass |
|---|---|---|---|
| 1 | **UI + Mock** | Build the full page/screen with hardcoded mock data. Reuse [ui-registry.md](ui-registry.md) components; register any new one. | Page renders with realistic mock content. |
| 2 | **Visual Verify** | Open in browser. Check against [ui-rules.md](ui-rules.md): layout, tokens, responsive (768/480), empty/loading/error states drawn. | Looks correct at all breakpoints; states visible. **Human sign-off.** |
| 3 | **Contract** | Define TypeScript types + the API contract (routes, request/response shape) the UI needs. Mock data now conforms to these types. | Types compile; mock matches contract exactly. |
| 4 | **Wire Read** | Build backend read path (route → controller → service → repository → ORM) and the frontend service. Replace mock with real fetch. Handle loading/error/empty. | Real data renders on screen. |
| 5 | **Wire Write** | Build create/update/delete + validation (both sides). Wire forms, modals, toasts. **Default: refetch after mutation** (not optimistic updates). | Actions work end-to-end and are visible (toast/table update). |
| 6 | **Test & Done** | Validation, RBAC on the route, edge cases; unit test service logic; manual test the happy + failure paths. Update registry + progress tracker. | Definition of Done (§3) met. |

**Golden path for data flow** ([architecture.md](architecture.md) §9): UI → feature service → route → controller → service → repository → ORM → database → shared handlers → UI.

---

## 2. Conventions (apply everywhere)

- **Stack**: Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4; Node.js · Express 4 · Prisma 7 · PostgreSQL. Icons via `react-icons` + Material Symbols Outlined; charts via Chart.js (`react-chartjs-2`).
- **Structure**: feature-based folders per [architecture.md](architecture.md) §4.3 (backend) and §5.2 (frontend). Naming per [code-standards.md](code-standards.md) §4.
- **Shared handlers first**: singleton `asyncHandler` + centralized `errorHandler` exist before any module route.
- **Every protected route** gets RBAC middleware. Roles: `ADMIN`, `OFFICER`, `PUBLIC`.
- **Mock data lives in** `src/shared/mocks/<feature>.mock.ts` and is deleted (or flag-gated) once step 4 replaces it.
- **Registry discipline**: never invent a component that already exists in [ui-registry.md](ui-registry.md); register new ones the moment they're built.
- **Feature folders are domains, not roles.** `price-record/`, `stores/`, `commodity/` — never a folder named after who uses it.
- **Imports use the `@/` alias**, never `../../../../`.

---

## 3. Definition of Done (per feature)

A feature is done only when **all** are true:

- [ ] Full UI matches [ui-rules.md](ui-rules.md); responsive at 768px & 480px (and 1024px — see [ui-rules.md](ui-rules.md) §5).
- [ ] Loading, empty, and error states are visibly implemented (not blank).
- [ ] Real data reads render on screen; no remaining mock in the render path.
- [ ] All writes (create/update/delete) work end-to-end with visible feedback (toast/refresh).
- [ ] Validation on **both** frontend and backend; invalid input rejected early ([code-standards.md](code-standards.md) §6.6).
- [ ] Route protected by RBAC for the correct role(s).
- [ ] Service-layer business logic has unit tests; happy + failure paths manually verified.
- [ ] [ui-registry.md](ui-registry.md) and [progress.md](progress.md) updated.

---

## 4. Cross-Cutting (verified continuously, not a separate phase)

- **RBAC**: enforced per route as each feature is wired; re-checked at each phase exit.
- **Validation & error handling**: schema validation both sides; centralized error responses ([code-standards.md](code-standards.md) §6.5–6.6).
- **Security** ([architecture.md](architecture.md) §8): hashed passwords, protected routes, audit logging on critical actions, input sanitization, no secrets in code.
- **Responsive & states**: every screen handles 1024/768/480, loading/empty/error — checked at step 2 of the loop.
- **Accessibility**: labels on inputs, focus rings, keyboard-navigable modals.

---

## 5. Sequencing Rules

1. Finish a feature's full loop (§1) before starting the next.
2. Within a phase, follow the listed order — later features depend on earlier ones. **Build a feature before anything that aggregates its data.**
3. A phase's exit criteria must pass before the next phase begins.
4. Never merge a feature that fails its Definition of Done (§3).
5. **Phases R0–R3 run before Phase 1.** Do not build new product features on a structure that is mid-migration.

### 5a. The Refactor Gate (Phases R0–R3 only)

A refactor feature is done when **all** are true:

- [ ] `npx tsc --noEmit` passes in the affected workspace(s)
- [ ] `npm test` passes (backend)
- [ ] The behavior it touches is manually exercised in the running app
- [ ] `git commit` isolated to that one feature — never bundle refactor features
- [ ] [progress.md](progress.md) updated

**Refactors must not change behavior.** If a refactor requires a behavior change, split it into a separate, explicitly-labeled feature.

---

## Phase 0 — Foundation & Scaffolding

> **Status: substantially complete, documented retroactively.** Gaps are carried into Phases R0–R2 rather than repeated here.

**0.1 Repo & tooling** — ✅ frontend + backend workspaces, TypeScript strict both sides, ESLint (frontend). ❌ **No test runner script** despite 6 passing `node:test` files → **R2.1**. ❌ No formatter config.

**0.2 Design system port** — ✅ Material 3 tokens in `globals.css` `@theme inline`, type scale, card shadow. ❌ No base component library (Button, Card, Badge, Modal, Toast, Alert are all inline-per-use) → **Phase 1.1**. ❌ No component gallery page.

**0.3 App shell** — ✅ `AppShell`, `TopAppBar`, `NavigationDrawer`, `FooterSection`, responsive off-canvas drawer at `lg`. ⚠️ `MobileBottomNav` built but never rendered → Decision D-3.

**0.4 Backend spine** — ✅ `app.ts`, `asyncHandler`, `errorHandler`, Prisma client, CORS, cookie parsing. ❌ No `server.ts` split → **R2.2**. ❌ No `config/env.ts` typed validation → **R2.2**. ❌ No `/api/v1` versioning → **R2.3**. ❌ No health route.

**0.5 Database** — ✅ 7 models, 5 migrations applied. ❌ `storeId` nullability drift → **R0.2**. ❌ Only one index in the entire DB → **R2.5**. ❌ No seed script → **R2.6**.

---

## Phase P — Existing Product Features (retroactive record)

> Built before these standards existed. Listed here so [progress.md](progress.md) has a matching plan entry per the coupling rule; **no new work is planned in this phase.** Each module's outstanding items are carried into R0–R3 and Phases 1–2.

| # | Module | Endpoints | Carried into |
|---|---|---|---|
| P.1 | Authentication | `/api/auth/{login,me,logout}` | R0.1, 2.2 |
| P.2 | User Management | `/api/users` CRUD | **R0.1 (critical)** |
| P.3 | Commodity Catalog | `/api/commodities` CRUD | R0.1, R3.2 |
| P.4 | SRP | `/api/srps` CRUD | R0.1, 2.2 |
| P.5 | Store Registry | `/api/stores` CRUD | R0.1, R3.1 |
| P.6 | Price Records | `/api/price-records` CRUD | **R0.2 (critical)**, R3.1 |
| P.7 | Reports | `/api/reports` CRUD | R0.1, R3.1, D-6 |
| P.8 | Forecasting (ARIMA) | `/api/forecasts` + `/generate` | R0.1 |
| P.9 | Public Access | `/api/public/{commodities,forecasts}` | R1.1 |

**Phase P exit**: not applicable — this phase is a record, not a plan. It closes when R0–R3 and Phase 1 bring every module to the Definition of Done (§3).

---

## Phase R0 — Critical Security Remediation

Goal: close the privilege-escalation hole and the null-dereference crash. **Nothing else ships before this.**

### R0.1 RBAC Middleware

The system has **no authorization layer**. `authenticate` verifies the JWT and nothing more. Role checks exist only as a `requireAdmin()` helper duplicated inside two controllers. `/api/users` has no check at all, and `createUserSchema` accepts `role`, so **any authenticated user can mint themselves an ADMIN account**.

- **Files (new)**:
  - `backend/src/shared/middleware/authorize.ts` — `authorize(...roles: UserRole[])`, 403 on mismatch
  - `backend/src/shared/middleware/authorize.test.ts`
- **Files (edit)** — attach `authorize(...)` per the RBAC matrix in [architecture.md](architecture.md) §8:
  - `backend/src/modules/user/user.routes.ts` — **all 5 routes → `ADMIN`**
  - `backend/src/modules/commodity/commodity.routes.ts` — writes → `ADMIN`; reads → all
  - `backend/src/modules/srp/srp.routes.ts` — writes → `ADMIN`; reads → all
  - `backend/src/modules/store/store.routes.ts` — `ADMIN`, `OFFICER`
  - `backend/src/modules/price-record/price-record.routes.ts` — `ADMIN`, `OFFICER`
  - `backend/src/modules/report/report.routes.ts` — `ADMIN`, `OFFICER`
  - `backend/src/modules/forecast/forecast.routes.ts` — `ADMIN`, `OFFICER`
- **Files (cleanup)** — delete the local helper now that middleware covers it:
  - `backend/src/modules/commodity/commodity.controller.ts` — remove `requireAdmin`
  - `backend/src/modules/srp/srp.controller.ts` — remove `requireAdmin`
- **Verify**: unit tests on `authorize`; manually confirm an OFFICER token gets 403 on `POST /api/users`
- **Done gate**: an OFFICER-role token cannot create, read, update, or delete any user, and cannot set `role` on any endpoint.

### R0.2 Fix `storeId` Nullability Drift

The DB allows `PriceRecord.storeId` to be `NULL` (`ON DELETE SET NULL`); `schema.prisma` says it cannot. Prisma's types therefore lie, and one call site dereferences it unguarded.

- **Files (edit)**:
  - `backend/prisma/schema.prisma` — `storeId String?`, `store Store?`
  - `frontend/src/features/officer/MonitoringOfficerDashboardPage.tsx` — line ~187, `record.store.name` → `record.store?.name ?? "Unknown store"`
- **Steps**: edit schema → `npx prisma generate` → `npx tsc --noEmit` in both workspaces → fix every newly-surfaced error
- **Verify**: delete a store that has price records; the officer dashboard renders without throwing
- **Done gate**: `tsc` clean with the corrected nullability, and no unguarded `.store.` dereference remains.

### R0.3 Remove the `PUBLIC` Role *(D-7)*

`PUBLIC` is vestigial. Public pages read unauthenticated `/api/public/*`, there is no registration endpoint, and no way to obtain a `PUBLIC` account. Keeping it means every `authorize` call must reason about a role that should never hold a token — extra surface for no benefit.

> **Behavior change, deliberately.** This is not a pure refactor. It is grouped into R0 because it shrinks the authorization surface R0.1 has to cover, and doing it after R0.1 would mean writing those guards twice.

- **Files (edit)**:
  - `backend/src/modules/user/user.schema.ts` — `role` enum → `["ADMIN", "OFFICER"]` on both create and update
  - `backend/prisma/schema.prisma` — drop `@default(PUBLIC)` on `User.role`; make `role` required
  - `backend/src/modules/auth/auth.service.ts` — reject login for any non-`ADMIN`/`OFFICER` principal
  - `frontend/src/lib/auth.ts` — remove `"public"` from the `UserRole` union
  - `frontend/src/middleware.ts` — drop `PUBLIC` route branches
- **Files (new)**: migration reassigning any existing `PUBLIC` rows, then dropping the enum value
- **⚠️ Order matters**: PostgreSQL cannot drop an enum value while rows reference it. **Query for existing `PUBLIC` users first.** If any exist, decide per row (promote to `OFFICER` or deactivate) before the migration — do not assume the table is clean.
- **Verify**: `SELECT role, count(*) FROM "User" GROUP BY role` returns no `PUBLIC`; public pages still load while logged out
- **Done gate**: `UserRole` has exactly two values; unauthenticated public pages are unaffected.

**Phase R0 exit**: privilege escalation closed, null-crash closed, `PUBLIC` role gone, `tsc` + `npm test` green.

---

## Phase R1 — Dead Code & Shared Layout

Goal: delete what isn't used, and move shared code to where the standard says it lives. Purely mechanical — the compiler verifies all of it.

### R1.1 Delete Dead Code

Eight orphaned files, confirmed by an importer sweep.

- **Files (delete)**:
  - `frontend/src/features/admin/components/UsersManagementPage.tsx` *(duplicate — live copy is `admin/users/components/`)*
  - `frontend/src/features/officer/ReportGenerationPage.tsx` *(duplicate — live copy is `officer/reports/`)*
  - `frontend/src/features/public/PublicUserDashboardPage.tsx`
  - `frontend/src/features/dashboard/FeaturedSection.tsx`
  - `frontend/src/features/dashboard/TopCommoditiesGrid.tsx`
  - `frontend/src/features/commodity/components/CommodityDetailsDialog.tsx`
  - `frontend/src/app/(test)/test-page/page.tsx` *(hardcoded `localhost:3000`/`:5000` fetches)*
  - `frontend/src/features/admin/components/` *(directory, once emptied)*
  - `frontend/src/components/MobileBottomNav.tsx` *(D-3 — non-functional scaffolding)*
  - `frontend/src/components/RoleSwitcher.tsx` *(D-3 — non-functional scaffolding)*
- **Verify**: `tsc` clean; every route still renders
- **Done gate**: zero components with no importer.

### R1.2 Stop Tracking Build Output

- **Files (new)**: `.gitignore` at repo root — `node_modules/`, `dist/`, `.next/`, `*.tsbuildinfo`, `backend/reports/*` (keep `.gitkeep`)
- **Files (edit)**: `backend/.gitignore` — add `dist/`, `reports/*`
- **Command**: `git rm -r --cached backend/dist backend/reports`
- **Verify**: `git status` clean after a build
- **Done gate**: 65 `dist/` artifacts and 9 generated report files no longer tracked.

### R1.3 Backend → `src/shared/`

- **Moves**:
  - `src/utils/asyncHandler.ts` → `src/shared/handlers/asyncHandler.ts`
  - `src/middleware/error.middleware.ts` → `src/shared/handlers/errorHandler.ts`
  - `src/middleware/auth.middleware.ts` → `src/shared/middleware/authenticate.ts`
  - `src/utils/AppError.ts` → `src/shared/utils/AppError.ts`
  - `src/utils/helper.ts` → `src/shared/utils/helper.ts`
  - `src/utils/passwordUtils.ts` → `src/shared/utils/password.utils.ts`
  - `src/types/pdfkit.d.ts` → `src/shared/types/pdfkit.d.ts`
  - root `types/express.d.ts` → `src/shared/types/express.d.ts` *(resolves the two-type-dirs problem)*
- **Import sites**: 27 — all surfaced by `tsc`
- **Also edit**: `backend/tsconfig.json` if the root `types/` dir was in `include`
- **Done gate**: `tsc` + `npm test` green; no `src/utils/` or `src/middleware/` remains.

### R1.4 Frontend → `src/shared/`

- **Moves**:
  - `src/lib/api.ts` → `src/shared/services/api.ts`
  - `src/lib/auth.ts` → `src/shared/services/auth.ts`
  - `src/lib/jwt.ts` → `src/shared/utils/jwt.ts`
  - `src/components/*.tsx` (5 live) → `src/shared/components/`
  - `src/features/officer/components/FieldError.tsx` → `src/shared/components/FieldError.tsx` *(used across features)*
- **Import sites**: 8 alias imports + `FieldError` consumers
- **Done gate**: `tsc` clean; `src/lib/` and `src/components/` gone.

### R1.5 kebab-case Filenames

- **Renames**:
  - `features/officer/store/storeApi.ts` → `stores.api.ts` *(folder handled in R3.1)*
  - `features/officer/store/storeHooks.ts` → `use-stores.ts`
  - `features/officer/components/storeStatus.ts` → `store-status.ts`
  - `features/officer/price-records.types.ts` → stays (already kebab)
- **Note**: `.tsx` component files keep PascalCase per [code-standards.md](code-standards.md) §4
- **Done gate**: no camelCase `.ts` filenames outside components.

**Phase R1 exit**: `tsc` green both workspaces, `npm test` green, app boots and every route renders.

---

## Phase R2 — Backend Spine & Versioning

Goal: bring the backend spine up to [architecture.md](architecture.md) §4.1.

### R2.1 Test Runner

Six `node:test` files exist and pass, but no script runs them — so CI and the Definition of Done have nothing to call.

- **Files (edit)**: `backend/package.json` → `"test": "tsx --test src/**/*.test.ts"`, `"test:watch"`
- **Verify**: `npm test` reports 6 passing
- **Done gate**: a single command runs the suite.

### R2.2 `server.ts` Split + Typed Env

- **Files (new)**:
  - `backend/src/config/env.ts` — Zod schema over `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`; parsed once at import; **throws on boot** if invalid
  - `backend/src/server.ts` — imports `app`, calls `listen`
- **Files (edit)**:
  - `backend/src/app.ts` — remove `app.listen` and `port`; export the app
  - `backend/package.json` — `dev`/`start` point at `server.ts` / `dist/server.js`
  - every `process.env.X` reader → import from `config/env` (removes the `JWT_SECRET!` non-null assertion)
- **Done gate**: booting with a missing `JWT_SECRET` fails immediately with a readable message, not on first request.

### R2.3 `/api/v1` Versioning

Cheap because the BFF absorbs it — 6 edits, not 30.

- **Files (edit)**:
  - `backend/src/app.ts` — 3 mounts → `/api/v1/auth`, `/api/v1/public`, `/api/v1`
  - `frontend/src/app/api/[...path]/route.ts` — rewrite `/api/*` → `/api/v1/*` when building `targetUrl`
  - `frontend/src/app/api/auth/login/route.ts` — `/api/auth/login` → `/api/v1/auth/login`
  - `frontend/src/app/api/auth/me/route.ts` — `/api/auth/me` → `/api/v1/auth/me`
- **Unchanged**: all 30 `/api/...` call sites in components — `/api/*` remains the frontend's own namespace
- **Verify**: log in, load each role's dashboard, create a price record — `tsc` cannot catch a wrong path here, so this **must** be exercised in the running app
- **Done gate**: every screen loads data against `/api/v1` with no 404s.

### R2.4 Remove `any` From Shared Handlers

- **Files (edit)**:
  - `src/shared/handlers/asyncHandler.ts` — typed `AsyncRouteHandler` ([code-standards.md](code-standards.md) §9)
  - `src/shared/handlers/errorHandler.ts` — `err: unknown` + narrowing
- **Done gate**: no `any` in `src/shared/`.

### R2.5 Add Missing Indexes

- **Files (edit)**: `backend/prisma/schema.prisma` — the 9 indexes in [database-design.md](database-design.md) §6
- **Files (new)**: one migration
- **Done gate**: migration applies cleanly; `prisma migrate status` clean.

### R2.6 Seed Script

- **Files (new)**: `backend/prisma/seed.ts` — one user per role, ~10 commodities with SRPs, ~5 stores, ~90 days of price records (enough for ARIMA to produce a real forecast)
- **Files (edit)**: `backend/package.json` — `"seed"` script
- **Done gate**: a clean database seeded in one command renders every screen with realistic data.

**Phase R2 exit**: `npm test` runs from a script, boot fails fast on bad config, all traffic on `/api/v1`, seeded DB.

---

## Phase R3 — Feature Domain Restructure

Goal: frontend features organized by **domain**, not by role.

> **Why this phase is larger than it looks.** `features/officer/` is a *role* folder holding domains used by *two* roles — `admin/price-records` and `admin/stores` both import from it. The fix is not to tidy `officer/`; it is to split it into real domain features. ~75 files, ~68 relative imports.

### R3.1 Split `features/officer/` Into Domains

- **New feature — `features/price-record/`**:
  - `pages/PriceRecordsPage.tsx` ← `officer/PriceRecordsPage.tsx`
  - `components/` ← `PriceRecordFilters.tsx`, `PriceRecordForm.tsx`, `PriceRecordsTable.tsx`
  - `types/price-record.types.ts` ← `officer/price-records.types.ts`
  - `index.ts`
- **New feature — `features/stores/`** *(plural — resolves the state/retail collision, Decision D-1)*:
  - `pages/StoreRegistryPage.tsx` ← `officer/StoreRegistryPage.tsx`
  - `components/` ← `StoreCard.tsx`, `StoreRegistryGrid.tsx`, `StoreRegistryHeader.tsx`, `StoreRegistryToolbar.tsx`, `CreateStoreDialog.tsx`, `StorePriceRecordsModal.tsx`
  - `services/stores.api.ts` ← `officer/store/storeApi.ts`
  - `hooks/use-stores.ts` ← `officer/store/storeHooks.ts`
  - `utils/store-status.ts` ← `officer/components/storeStatus.ts`
  - `index.ts`
- **New feature — `features/report/`**:
  - `pages/ReportGenerationPage.tsx` ← `officer/reports/ReportGenerationPage.tsx`
  - `components/` ← `ExportFormatButton.tsx`, `RecentReportCard.tsx`, `ReportTypeCard.tsx`
  - `services/report.api.ts` ← `officer/reports/api.ts`
  - `types/report.types.ts` ← `officer/reports/types.ts`
  - `mocks/report.mock.ts` ← `officer/reports/data.ts`
  - `index.ts`
- **Remaining `features/officer/`** — the officer dashboard only:
  - `pages/MonitoringOfficerDashboardPage.tsx`
  - `constants/officer.constants.ts` ← `officer/constants.ts`
  - `types/officer.types.ts` ← `officer/types.ts`
  - `index.ts`
- **Files (edit)** — 4 route files repointed to the new domains:
  - `app/(protected)/admin/price-records/page.tsx`, `app/(protected)/officer/price-records/page.tsx`
  - `app/(protected)/admin/stores/page.tsx`, `app/(protected)/officer/stores/page.tsx`
  - `app/(protected)/officer/reports/page.tsx`
- **Done gate**: no feature folder is named after a role except `officer/` (which now holds only the officer dashboard); `tsc` clean.

### R3.2 Normalize Remaining Features

- `features/admin/users/` → `admin/users/{pages,components,services,types}`; `users.schema.ts` → `schemas/`; `api/users.api.ts` → `services/`
- `features/commodity/` → move `CommodityListPage.tsx` + `CommodityManagementPage.tsx` into `pages/`; `api/*.api.ts` → `services/`
- `features/dashboard/` → `pages/DashboardPage.tsx`, `components/{HeroSection,SummaryStats}.tsx`
- `features/public/` → `pages/PriceAnalysisPage.tsx`, keep `components/price-analysis/`
- `features/auth/` → already conformant; add `index.ts`
- **Every feature gets an `index.ts`** as its public surface
- **Done gate**: all six features match the §5.2 shape.

### R3.3 Normalize Imports

- Replace every `../../../../features/...` with `@/features/...` (5 route files identified)
- Route `page.tsx` files import only from a feature's `index.ts`
- **Done gate**: zero `../../` imports crossing a feature boundary.

### R3.4 Backend Module `index.ts` + `.types.ts`

- **Files (new)**: `index.ts` for all 9 modules; `<module>.types.ts` where a module has domain types currently inline
- **Files (edit)**: `src/routes/index.ts` and `app.ts` import from module `index.ts`
- **Done gate**: every module matches [architecture.md](architecture.md) §4.3.

**Phase R3 exit**: `tsc` green, `npm test` green, full manual walkthrough of all three roles, [ui-registry.md](ui-registry.md) paths updated.

---

## Phase 1 — Shared UI Primitives

Goal: the base component library Phase 0.2 never produced. **Runs the full Feature Loop (§1).**

### 1.1 Base Component Set
- **Screens**: a component gallery page rendering every variant
- **Components**: `Button`, `Card`, `Badge`, `Modal`, `Toast`, `Alert`, `Input`, `Select`, `FormGroup`, `PageShell`
- **Resolves**: the duplicated modal overlay (5 copies), inline button classes, the `min-h-screen lg:ml-72` wrapper repeated in 10 pages, and the missing `.badge` utility
- **Access**: all roles
- **Done gate**: gallery renders every component in every variant at 1024/768/480; registry updated.

### 1.2 Status Tokens & Card Convergence
- Add `success` / `warning` / `info` tokens to `globals.css`
- Remove the five `!important` hardcoded utilities shadowing tokens
- Converge card radius/background/shadow on one recipe; replace `bg-white` and `bg-slate-950/40` with tokens
- Define the undefined `text-body-md` or remove its usage
- **Done gate**: no hardcoded hex in any component; `PriceStatus` styled from tokens everywhere.

### 1.3 Write Feedback
- Wire `Toast` into every create/update/delete across all features
- **Done gate**: every mutation produces visible confirmation — closes the Definition of Done gap.

**Phase 1 exit**: no component defines a color or overlay inline.

---

## Phase 2 — Product Gaps

### 2.1 Dashboard Visualization
- **Screens**: admin + officer dashboards
- **Mock/UI first**: price-trend line chart, commodity comparison bar chart, SRP-vs-actual chart
- **Contract**: aggregate endpoints under `/api/v1/`
- **Access**: `ADMIN`, `OFFICER`
- **Done gate**: charts render real aggregates. *(Chart.js is currently used in exactly one component; these are the "trend graphs" [project-overview.md](project-overview.md) promises.)*

### 2.2 Audit Logging
- **Contract**: `audit_logs` table ([database-design.md](database-design.md) §3.1); write on login, user CRUD, SRP change, price-record delete
- **Screens**: admin-only audit log viewer
- **Access**: `ADMIN`
- **Done gate**: every critical action produces a queryable entry — closes the §4 cross-cutting requirement.

### 2.3 Settings Pages
- Both settings routes exist but are empty shells
- **Done gate**: profile + password change working for all roles.

### 2.4 Report Storage Independence *(D-6)*

Generated reports are written to `backend/reports/` and served from `/reports/files`. That couples every report to one machine's disk: an ephemeral or containerized redeploy loses them, and horizontal scaling serves 404s from whichever instance didn't generate the file.

> **Pull this forward if a production deploy is scheduled before Phase 2** — it is the one item here that blocks deployment rather than merely improving the product.

- **Files (new)**:
  - `backend/src/shared/storage/storage.types.ts` — `ReportStorage` interface: `save(key, buffer, contentType)` → URL, `getUrl(key)`, `delete(key)`
  - `backend/src/shared/storage/local.storage.ts` — current filesystem behavior behind the interface (keeps local dev working with no external dependency)
  - `backend/src/shared/storage/index.ts` — selects the driver from `config/env`
- **Files (edit)**:
  - `backend/src/modules/report/report.generator.ts` — write through the interface, never `fs` directly
  - `backend/src/modules/report/report.service.ts` — persist the returned key/URL
  - `backend/src/config/env.ts` — add `STORAGE_DRIVER` (`local` | `s3`) plus the credentials the chosen driver needs
  - `backend/src/app.ts` — serve the static mount only when the driver is `local`
- **Contract**: `Report.fileUrl` stores a **storage key**, not a filesystem path; the URL is resolved at read time so the same row works under either driver
- **Access**: unchanged — `ADMIN`, `OFFICER` (own scope)
- **Done gate**: switching `STORAGE_DRIVER` changes where reports live with **no code change**, and a report generated under one driver is still downloadable after a restart.

**Phase 2 exit**: every feature in [project-overview.md](project-overview.md) is real, and no feature depends on a single machine's disk.

---

## 6. Recommended MVP Slice (if time-boxed)

**R0 → R2.1 → R2.6 → R1.1 → R1.2**

Closes the privilege-escalation hole and the crash, makes the tests runnable, and produces seedable demo data — the minimum for a system that is safe to demonstrate. Structural phases (R1.3–R3) improve maintainability but change nothing a demo audience sees, so they yield to R0 under time pressure.

---

## 7. Decisions

### Settled

| # | Decision | Resolution |
|---|---|---|
| D-1 | `store/` name collision — retail store vs. state store | **Retail domain uses `stores/` (plural)**; singular `store/` reserved for state management, currently unused |
| D-2 | Role model — relational vs. flat enum | **Flat `UserRole` enum on `User`.** Granular runtime permissions are out of scope; adding them is a migration ([database-design.md](database-design.md) §3.1) |
| D-4 | `.validator.ts` vs. `.schema.ts` | **Merged.** Zod schemas are both shape and validator ([architecture.md](architecture.md) §4.3) |
| D-5 | Docs describe target or current state | **Target**, with gaps tracked in [progress.md](progress.md) → Blockers |
| D-3 | `MobileBottomNav` / `RoleSwitcher` — wire up or delete? | **Delete both.** Neither is functional: `MobileBottomNav` renders hardcoded `Home/Search/Alerts/Profile` `<div>`s with no links, no routing, and a static `active` flag — destinations that don't exist in this app. `RoleSwitcher` holds local `useState` that calls nothing, using lowercase role strings that don't match the `UserRole` enum. Both are template scaffolding. A real bottom nav is built in **Phase 1.1** against the actual route set if wanted. → **R1.1** |
| D-6 | Report file storage | **Make storage backend-independent.** Reports must not depend on the backend's local filesystem. → **Phase 2.4** |
| D-7 | Is a `PUBLIC`-role account needed? | **No — remove the role.** Public access is unauthenticated via `/api/public/*`; there is no registration endpoint and no way to obtain a `PUBLIC` account. → **R0.3** |

### Open

*None.*

---

## 8. Progress Tracking

Progress is **not** tracked in this file. This document is the plan (*what to build*); [progress.md](progress.md) is the record (*what is done*).

[progress.md](progress.md) holds, per feature: current status and Feature Loop step, screens and components built, API endpoints, files touched, what remains, blockers, plus a cross-cutting checklist, open decisions, and a session log.

**Update [progress.md](progress.md) at the end of every work session and every time a Loop step completes.**
