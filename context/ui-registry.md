# UI Registry

> **Living document.** Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

This registry catalogs every UI component in **PresyoSerbisyo**, its source location, and the exact classes it uses. The styling contract and design tokens live in [ui-rules.md](ui-rules.md). Stack, module structure, and conventions come from [architecture.md](architecture.md) and [code-standards.md](code-standards.md).

All paths are relative to `frontend/`.

---

## How to Use

**Before building any component:**

1. Check if a similar component already exists here.
2. If **yes** — match its exact classes and structure. Do not re-invent.
3. If **no** — build it following [ui-rules.md](ui-rules.md), then add it here.

**After building any component** — add the component name, file path, and exact classes used, plus a Change Log entry.

**Naming**: kebab-case files and folders, PascalCase component names ([code-standards.md](code-standards.md) §4). Group by feature module ([architecture.md](architecture.md) §5).

> ⚠️ **Read this before matching any card class.** The recipes below are what the code *actually contains*, and they are not consistent — card radius varies between `rounded-2xl` and `rounded-3xl` (never the documented `rounded-xl`), backgrounds alternate between `bg-surface-container-lowest` and hardcoded `bg-white`, and shadows vary across `data-card-shadow`, `shadow-sm`, and one arbitrary inline value. Converging these is **B-17**. Until it lands, prefer the token-based recipe in [ui-rules.md](ui-rules.md) §6 for new work and do not propagate `bg-white`.

---

## Legend

- **Status**: `planned` = not yet built · `prototype` = exists only in a design/prototype file · `built` = implemented in the app
- **⚠️ orphaned** = built but imported by nothing; slated for deletion in [build-plan.md](build-plan.md) R1.1
- **🗑️ delete** = decided for removal (D-3) — do not reuse or revive
- **File**: real path once built; the prototype file's name while prototype-only.

---

## 1. Foundations

| Token / Utility | Source | Reference |
|---|---|---|
| Design tokens (colors, radius, spacing) | `src/app/globals.css` → `@theme inline` | [ui-rules.md](ui-rules.md) §2 |
| Type scale (`.text-h1-desktop` … `.text-label-caps`) | `src/app/globals.css` | [ui-rules.md](ui-rules.md) §4 |
| `.data-card-shadow` · `.animate-stats` · `.scrollbar-none` | `src/app/globals.css` | [ui-rules.md](ui-rules.md) §4 |
| Badge pills | built — `src/shared/components/Badge.tsx` | 4 variants (`primary`/`secondary`/`error`/`neutral`); `success`/`warning`/`info` variants pending status tokens (B-13, Phase 1.2) |

---

## 2. Layout Components

| Component | Status | File | Exact classes |
|---|---|---|---|
| AppShell | built | `src/shared/components/AppShell.tsx` | `flex min-h-screen flex-col` · main: `flex-1 pb-8 md:pb-10` |
| ClientAppShell | built | `src/shared/components/ClientAppShell.tsx` | none — `usePathname` wrapper around AppShell |
| TopAppBar | built | `src/shared/components/TopAppBar.tsx` | `sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-outline-variant bg-surface px-container-margin-mobile py-stack-md shadow-sm md:px-container-margin-desktop` |
| NavigationDrawer | built | `src/shared/components/NavigationDrawer.tsx` | nav item: `mx-2 mt-2 flex items-center gap-4 rounded-full px-6 py-3 text-on-surface-variant transition-all hover:bg-surface-variant` |
| FooterSection | built | `src/shared/components/FooterSection.tsx` | `flex w-full lg:ml-72 lg:max-w-[calc(100%-18rem)] flex-col items-center justify-between gap-stack-md border-t border-outline-variant bg-surface-container-highest px-container-margin-mobile py-stack-lg md:flex-row md:px-container-margin-desktop` |
| PageShell | built | `src/shared/components/PageShell.tsx` | `min-h-screen lg:ml-72` + any extra `className` — extracts the wrapper that was repeated verbatim in 10 page components (B-18). **Not yet adopted by existing pages** — they keep their inline `<main className="min-h-screen lg:ml-72">` until migrated; only new work (starting with the component gallery) uses it. |

`AppShell` renders TopAppBar → NavigationDrawer → main → FooterSection.

> **R1.1 update (2026-08-13):** `MobileBottomNav` and `RoleSwitcher` are deleted per D-3 — no longer in the tree. `src/components/` and `src/lib/` no longer exist; everything moved to `src/shared/{components,services,utils}/` (R1.4). `FieldError` moved out of `features/officer/` to `src/shared/components/FieldError.tsx` — B-20 resolved.

---

## 1a. Shared UI Primitives (Phase 1.1)

Base component set built against the **documented** [ui-rules.md](ui-rules.md) §6 recipe, not the drifted inline markup found across existing pages (see the warning at the top of this file). Existing pages are **not yet migrated onto these** — that happens incrementally as each page is next touched. Demoed in full at `/component-gallery` (all roles, no auth).

| Component | Status | File | Variants / notes |
|---|---|---|---|
| Button | built | `src/shared/components/Button.tsx` | `primary`/`secondary`/`danger` × `sm`/`md`; `loading` (spinner), `disabled`. `rounded-full` per the documented spec — diverges from existing inline buttons, which are `rounded-xl` (the drift this component is meant to converge, not match) |
| Card | built | `src/shared/components/Card.tsx` | `rounded-xl border border-outline-variant bg-surface-container-lowest data-card-shadow` — the one canonical recipe, per §6 |
| Badge | built | `src/shared/components/Badge.tsx` | `primary`/`secondary`/`error`/`neutral`. `success`/`warning`/`info` tokens now exist (B-13 resolved in 1.2) but Badge hasn't adopted them yet — unscheduled follow-up |
| Modal | built | `src/shared/components/Modal.tsx` | Overlay `bg-inverse-surface/40` (token-based, replaces the non-token `bg-slate-950/40` in 5 duplicated modals — B-22) + `rounded-xl bg-surface-container-lowest` container. Escape-to-close, click-outside-to-close, `role="dialog"`/`aria-modal`. **No focus trap** — that gap (noted in the Cross-Cutting Checklist) is not closed by this component |
| Toast | built | `src/shared/components/Toast.tsx` | `ToastProvider` (mounted in root `layout.tsx`) + `useToast()` hook, `primary`/`success`/`error`/`neutral` variants (`success` added in 1.3 once B-13's token existed), auto-dismiss 4s, manual dismiss. **Wired into all 8 create/update/delete mutations across the app as of Phase 1.3** (2026-08-14) — closes B-23, self-verified via Playwright, pending human sign-off |
| Alert | built | `src/shared/components/Alert.tsx` | `error`/`neutral`; inline banner, `role="alert"` |
| Input | built | `src/shared/components/Input.tsx` | `forwardRef` (works with `react-hook-form`'s `register()`); `hasError` prop for the error border/ring treatment |
| Select | built | `src/shared/components/Select.tsx` | Same pattern as Input |
| FormGroup | built | `src/shared/components/FormGroup.tsx` | Composes label + field + `FieldError`; matches the `space-y-1.5` field wrapper pattern already used everywhere |

**Gallery page**: `src/app/(public)/component-gallery/page.tsx` — renders every component in every variant; visually verified at 1024/768/480 by the user on 2026-08-13.

---

## 3. Data Display

| Component | Status | File | Exact classes |
|---|---|---|---|
| UsersTable | built | `src/features/admin/users/components/UsersTable.tsx` | `overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm` |
| UsersStatsSection | built | `src/features/admin/users/components/UsersStatsSection.tsx` | `grid gap-4 sm:grid-cols-2 xl:grid-cols-4` |
| CommodityTable | built | `src/features/commodity/components/CommodityTable.tsx` | `flex min-h-105 flex-1 flex-col rounded-3xl border border-outline-variant bg-white p-6 data-card-shadow md:p-8` |
| CommoditySummaryCards | built | `src/features/commodity/components/CommoditySummaryCards.tsx` | `flex flex-wrap gap-6` |
| PriceRecordsTable | built | `src/features/price-record/components/PriceRecordsTable.tsx` | row actions: `flex flex-wrap items-center gap-2` |
| StoreCard | built | `src/features/stores/components/StoreCard.tsx` | title: `mb-1 truncate font-h3-desktop text-h3-desktop text-on-surface` (compact variant: `text-sm font-semibold`) |
| StoreRegistryGrid | built | `src/features/stores/components/StoreRegistryGrid.tsx` | empty state: `rounded-2xl border border-dashed border-outline-variant bg-white p-8 text-center text-body-md text-on-surface-variant` — ⚠️ `text-body-md` **is not defined** in `globals.css` (B-19) |
| StoreRegistryHeader | built | `src/features/stores/components/StoreRegistryHeader.tsx` | `mb-2 flex items-center gap-2 text-primary` |
| RecentReportCard | built | `src/features/report/components/RecentReportCard.tsx` | `rounded-3xl border border-outline-variant bg-white p-5` |
| ReportTypeCard | built | `src/features/report/components/ReportTypeCard.tsx` | badge: `absolute right-4 top-4` |
| HeroSection | built | `src/features/dashboard/components/HeroSection.tsx` | `relative overflow-hidden bg-white px-container-margin-mobile py-16 md:px-container-margin-desktop md:py-24` |
| SummaryStats | built | `src/features/dashboard/components/SummaryStats.tsx` | `bg-surface-container-low px-container-margin-mobile py-12 md:px-container-margin-desktop` |
| PriceAnalysisHeader | built | `src/features/public/components/price-analysis/PriceAnalysisHeader.tsx` | `text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl md:text-4xl` — ⚠️ raw sizes instead of the type scale |
| PriceAnalysisSummaryCards | built | `src/features/public/components/price-analysis/PriceAnalysisSummaryCards.tsx` | `grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3` |
| ForecastSummaryPanel | built | `src/features/public/components/price-analysis/ForecastSummaryPanel.tsx` | `flex flex-col gap-4 sm:gap-6` |
| ForecastMethodPanel | built | `src/features/public/components/price-analysis/ForecastMethodPanel.tsx` | `rounded-3xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm sm:p-6` |
| DailyChangesPanel | built | `src/features/public/components/price-analysis/DailyChangesPanel.tsx` | `flex items-start justify-between gap-4` |

---

## 4. Charts

| Component | Status | File | Exact classes |
|---|---|---|---|
| PriceTrendPanel | built | `src/features/public/components/price-analysis/PriceTrendPanel.tsx` | header: `mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between` |

**This is the only Chart.js component in the codebase.** `chart.js` + `react-chartjs-2` are imported nowhere else.

The dashboard "price trend graphs" and "commodity comparison" visualizations described in [project-overview.md](project-overview.md) are **not built** — see [build-plan.md](build-plan.md) Phase 2. Any new chart must reuse this component's Chart.js registration pattern and read its colors from tokens ([ui-rules.md](ui-rules.md) §7).

---

## 5. Forms & Inputs

| Component | Status | File | Exact classes |
|---|---|---|---|
| FieldError | built | `src/shared/components/FieldError.tsx` | `mt-1 text-xs font-medium text-error` |
| PriceRecordForm | built | `src/features/price-record/components/PriceRecordForm.tsx` | `mx-auto w-full max-w-3xl rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)]` — ⚠️ arbitrary inline shadow |
| PriceRecordFilters | built | `src/features/price-record/components/PriceRecordFilters.tsx` | `grid gap-4 rounded-3xl border border-outline-variant bg-white p-5 data-card-shadow md:p-6` |
| UsersSearchFilters | built | `src/features/admin/users/components/UsersSearchFilters.tsx` | `flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between` |
| StoreRegistryToolbar | built | `src/features/stores/components/StoreRegistryToolbar.tsx` | `rounded-2xl border border-outline-variant bg-white p-6 shadow-sm` |

`FieldError` is the shared validation-message component — lives in `src/shared/components/` (moved there in R1.4, B-20 resolved).

Forms use `react-hook-form` + Zod resolvers. Shared `Input` / `Select` / `FormGroup` components now exist (§1a, Phase 1.1) — **existing forms still use inline field markup** (as shown in the entries above); migrating them is follow-up work, not yet done (B-21 partially resolved: the component exists, adoption doesn't).

---

## 6. Actions & Buttons

| Component | Status | File | Exact classes |
|---|---|---|---|
| ExportFormatButton | built | `src/features/report/components/ExportFormatButton.tsx` | label: `text-body-sm font-semibold` |
| Button | built | `src/shared/components/Button.tsx` | See §1a — Phase 1.1. Existing inline primary/secondary button classes across pages are **not yet migrated** onto this (B-21 partially resolved) |

---

## 7. Feedback & Overlays

| Component | Status | File | Exact classes |
|---|---|---|---|
| AddUserDialog | built | `src/features/admin/users/components/AddUserDialog.tsx` | error text: `mt-1 text-xs font-medium text-error` |
| AddCommodityDialog | built | `src/features/commodity/components/AddCommodityDialog.tsx` | error text: `mt-1 text-xs font-medium text-error` |
| UpdateSrpDialog | built | `src/features/commodity/components/UpdateSrpDialog.tsx` | overlay: `fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm` |
| CreateStoreDialog | built | `src/features/stores/components/CreateStoreDialog.tsx` | overlay: `fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm` |
| StorePriceRecordsModal | built | `src/features/stores/components/StorePriceRecordsModal.tsx` | overlay: `fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm` |
| ForecastDetailModal | built | `src/features/public/components/price-analysis/ForecastDetailModal.tsx` | overlay: `fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6` — ⚠️ diverges from the other five |
| Modal | built | `src/shared/components/Modal.tsx` | See §1a — Phase 1.1. The 5 duplicated overlay copies above are **not yet migrated** onto this (B-22 partially resolved: the shell exists, adoption doesn't) |
| Toast | built | `src/shared/components/Toast.tsx` | See §1a — Phase 1.3. Provider mounted globally; **wired into every create/update/delete across the app** as of 2026-08-14 (B-23 implemented, pending sign-off) |
| Alert | built | `src/shared/components/Alert.tsx` | See §1a — Phase 1.1 |
| Progress bar | **not implemented** | — | (B-23) |

---

## 8. Settings

| Component | Status | File | Exact classes |
|---|---|---|---|
| Admin settings page | built (route only) | `src/app/(protected)/admin/settings/page.tsx` | — |
| Officer settings page | built (route only) | `src/app/(protected)/officer/settings/page.tsx` | — |

Both settings routes exist but have no dedicated feature components registered here. Verify their contents before building anything new into them.

---

## 9. Page Components

Route-level feature pages. Listed for completeness — these compose the components above rather than being reusable themselves.

| Page | Status | File |
|---|---|---|
| LoginPage | built | `src/features/auth/components/LoginPage.tsx` |
| DashboardPage | built | `src/features/dashboard/pages/DashboardPage.tsx` |
| AdminDashboardPage | built | `src/features/admin/pages/AdminDashboardPage.tsx` |
| UsersManagementPage | built | `src/features/admin/users/pages/UsersManagementPage.tsx` |
| CommodityManagementPage | built | `src/features/commodity/pages/CommodityManagementPage.tsx` |
| CommodityListPage | built | `src/features/commodity/pages/CommodityListPage.tsx` |
| MonitoringOfficerDashboardPage | built | `src/features/officer/pages/MonitoringOfficerDashboardPage.tsx` |
| PriceRecordsPage | built | `src/features/price-record/pages/PriceRecordsPage.tsx` |
| StoreRegistryPage | built | `src/features/stores/pages/StoreRegistryPage.tsx` |
| ReportGenerationPage | built | `src/features/report/pages/ReportGenerationPage.tsx` |
| PriceAnalysisPage | built | `src/features/public/pages/PriceAnalysisPage.tsx` |

---

## Change Log

| Date | Component(s) | Change |
|---|---|---|
| 2026-08-13 | All | Registry populated from the existing codebase — 43 components catalogued, 8 flagged orphaned, 6 shared primitives identified as missing. |
| 2026-08-13 | MobileBottomNav, RoleSwitcher | Marked 🗑️ delete per D-3 — both inspected and found to be non-functional template scaffolding, not usable components. |
| 2026-08-13 | All | Reconciled every file path after refactor phases R1–R3: `src/components/`→`src/shared/components/`, `src/lib/`→`src/shared/{services,utils}/`, `features/officer/`→`features/{price-record,stores,report,officer}/` domain split, and every other feature's `pages/`/`components/`/`services/` normalization. Removed 8 deleted orphans (MobileBottomNav, RoleSwitcher, FeaturedSection, TopCommoditiesGrid, CommodityDetailsDialog, PublicUserDashboardPage, and the 2 duplicate UsersManagementPage/ReportGenerationPage entries) — they no longer exist in the tree. `FieldError` now correctly shown under Layout's shared note (B-20 resolved). |
| 2026-08-13 | Button, Card, Badge, Modal, Toast, Alert, Input, Select, FormGroup, PageShell | Phase 1.1 — the base component set Phase 0.2 never produced. All 10 added under §1a, built against the documented ui-rules.md §6 recipe rather than the drifted inline markup already in the app. Demoed at `/component-gallery`, visually verified at 1024/768/480 by the user. None of the 10 have been adopted by existing pages yet — that's incremental follow-up, not part of this feature. |
| 2026-08-14 | All cards, `Toast`, `NavigationDrawer` | Phase 1.2 — success/warning/info tokens added to `globals.css`; card recipe converged to `rounded-xl border border-outline-variant bg-surface-container-lowest data-card-shadow` across ~37 files; modal/drawer overlays converged to `bg-inverse-surface/40`\|`/30`; undefined `text-body-md` fixed. Visually signed off by the user. |
| 2026-08-14 | Toast | Phase 1.3 — added a `success` variant (B-13's token made this possible); wired `showToast` into all 8 create/update/delete handlers across the app. Self-verified via Playwright screenshots; pending human sign-off. |
