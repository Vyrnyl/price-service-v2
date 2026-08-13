# PresyoSerbisyo

A web-based commodity price monitoring and decision-support system for the **Department of Trade and Industry (DTI) Catanduanes**. Field officers record store prices on site, the system automatically classifies them against the official Suggested Retail Price (SRP), and the public gets price transparency. Core domains: commodity & SRP reference data, store registry, field price records, reporting, and ARIMA price forecasting.

Roles: `ADMIN` · `OFFICER` · `PUBLIC`

## Current state — read this first

**The application is already built and running.** Nine product modules work end to end across all three roles. It was built *before* these standards existed, so the docs describe the **target** structure and the gap is tracked explicitly.

Check [context/progress.md](context/progress.md) at the start of every session — it is the single source of truth for what is actually built. Never assume a feature exists; verify there first.

> 🔴 **Two critical defects are open. Read [context/progress.md](context/progress.md) → Blockers before touching backend code.**
> - **B-1** — privilege escalation: no `authorize` middleware exists, `/api/users` has no role check, and the user schemas accept `role`. Any authenticated user can make themselves `ADMIN`.
> - **B-2** — null-deref crash: `PriceRecord.storeId` is nullable in the database but not in `schema.prisma`, and one dashboard reads `record.store.name` unguarded.
>
> Both are fixed in **Phase R0**, which runs before anything else.

Verified baseline: backend `tsc` clean · frontend `tsc` clean · 6/6 tests pass (but no script invokes them — see R2.1).

## The one rule that governs everything

**UI-first, mock-data-first.** Every feature is built as a full, visible page with mock data and **visually verified by a human before any logic is written**. Then functionality is wired to that UI step by step.

**There are no invisible backend phases.** If you can't see it on screen, it isn't done. Never build a backend module "ahead" of its UI — that inverts the entire method.

The six-step **Feature Loop** (UI+Mock → Visual Verify → Contract → Wire Read → Wire Write → Test & Done) and its gates are defined in [context/build-plan.md](context/build-plan.md) §1. Do not start step N+1 until step N passes its gate.

> **Exception — refactor phases R0–R3.** Those change structure, not behavior, so there is no mock stage and no visual-verify gate. They use the **Refactor Gate** ([context/build-plan.md](context/build-plan.md) §5a): `tsc` clean, tests pass, behavior manually exercised, one commit per feature. A refactor that needs a behavior change must be split out and labeled as such.

## Use the skills

These encode the workflow — prefer them over ad-hoc work:

| Skill | When |
|---|---|
| `build-feature` | Implementing any feature/page/screen from the build plan |
| `add-component` | Creating any reusable UI piece (button, card, table, modal, chart…) |
| `checkpoint` | Saving/resuming session state; updating the tracker |
| `debug` | Anything broken, erroring, or rendering wrong |

## Documentation map

| File | Purpose |
|---|---|
| [context/build-plan.md](context/build-plan.md) | **What to build** — Feature Loop, Definition of Done, phases, settled decisions |
| [context/progress.md](context/progress.md) | **What is done** — per-feature status, 26 blockers, session log. Update every session |
| [context/ui-rules.md](context/ui-rules.md) | Design tokens, theme, component styling contract |
| [context/ui-registry.md](context/ui-registry.md) | Every UI component + its exact classes. **Check before building any component** |
| [context/architecture.md](context/architecture.md) | Module structure, data flow, API design, RBAC model |
| [context/database-design.md](context/database-design.md) | Schema, tables, ORM models, indexes |
| [context/code-standards.md](context/code-standards.md) | Naming, TypeScript, formatting, security standards |
| [context/project-overview.md](context/project-overview.md) | Scope, roles, modules, expected benefits |

## Stack

**Frontend**: Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 (Material 3 tokens) · `react-icons` + Material Symbols · Chart.js via `react-chartjs-2`
**Backend**: Node.js · Express 4 · TypeScript strict · Prisma 7 · PostgreSQL
**Auth**: JWT signed with `JWT_SECRET`, delivered as an httpOnly `accessToken` cookie; the Next.js BFF layer converts it to a Bearer header so the token never reaches client JavaScript

## Settled decisions — do not re-litigate

- **`stores/` (plural) is the retail-store domain.** A "store" here is a shop, not a state container. Never name a state folder `store/` in this project. *(D-1)*
- **Roles are a flat `UserRole` enum on `User`** — no `roles`/`permissions` join tables. Granular runtime permissions are out of scope and would require a migration. *(D-2)*
- **`.validator.ts` is merged into `.schema.ts`.** Zod schemas serve as both shape and validator. *(D-4)*
- **Docs describe the target structure**, with every gap tracked in [context/progress.md](context/progress.md) → Blockers. *(D-5)*
- **Feature folders are domains, not roles.** `price-record/`, `stores/`, `commodity/` — never a folder named after who uses it.
- **There is no `PUBLIC` role.** Only `ADMIN` and `OFFICER` hold accounts; public access is unauthenticated via `/api/public/*`. *(D-7, removed in R0.3)*
- **Report storage is backend-independent.** Reports go through the `ReportStorage` interface, never `fs` directly. *(D-6, built in Phase 2.4)*
- **`MobileBottomNav` and `RoleSwitcher` are deleted**, not revived — both were non-functional scaffolding. A real bottom nav gets built in Phase 1.1 if wanted. *(D-3)*

All decisions are settled — none open. The register lives in [context/build-plan.md](context/build-plan.md) §7.

## Conventions

- **Files/folders**: kebab-case. **React components**: PascalCase `.tsx`. **Types/classes**: PascalCase. **Vars/functions**: camelCase. **Constants/env**: UPPER_SNAKE_CASE.
- **Backend module shape**: controller · service · repository · routes · schema · types · scope · index. Controllers stay thin; business logic lives in services; all DB access goes through repositories.
- **Data flow**: UI → feature service → route → controller → service → repository → ORM → database → shared handlers → UI.
- **Always** use the singleton `asyncHandler` and centralized `errorHandler`. Never swallow errors.
- **Validate on both sides** — frontend and backend. Reject invalid requests early.
- **Every protected route** gets RBAC middleware, *and* own-data roles get service-layer scoping. Both layers are required — see [context/architecture.md](context/architecture.md) §8.
- **Imports use the `@/` alias**, never `../../../../`.
- 2-space indent, semicolons, double quotes, TypeScript strict, avoid `any`.
- Mock data lives in `src/shared/mocks/<feature>.mock.ts` and is removed from the render path once real data is wired.

## Gotchas

- **Check [context/ui-registry.md](context/ui-registry.md) before building any component** — but read its warning first: the existing card recipes are *inconsistent* (`rounded-2xl` vs `rounded-3xl`, `bg-white` vs token, three shadows). Match [context/ui-rules.md](context/ui-rules.md) §6 for new work, not the drift.
- **There is no shared Button, Input, Modal, Toast, or Alert.** Markup is duplicated across every page and the modal overlay is copied five times. Phase 1.1 builds them; don't add a sixth copy.
- **No mutation shows visible feedback** — no toast component exists, so every write feature currently fails the Definition of Done (B-23).
- **`/api/*` in frontend code is the BFF namespace, not the backend contract.** Backend version changes are absorbed in `app/api/[...path]/route.ts`; don't rewrite the 30 client call sites.
- **The real responsive break is 1024px (`lg`)**, not the 768px the generic standard assumes. Check 1024, 768, *and* 480.
- **Every screen needs loading, empty, and error states drawn** — a blank state fails the visual-verify gate.
- [context/build-plan.md](context/build-plan.md) and [context/progress.md](context/progress.md) are tightly coupled: adding a feature to one requires a matching entry and count update in the other.
- Secrets come from env vars only. Never hardcode them. `.env` is gitignored and correctly untracked — keep it that way.
- **Work happens in `price-service-v2`.** The original `price-service` is the untouched backup.
