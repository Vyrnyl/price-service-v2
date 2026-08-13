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
| Badge pills (`.badge` + variants) | **not implemented** | [ui-rules.md](ui-rules.md) §4 — blocked on status tokens (B-13) |

---

## 2. Layout Components

| Component | Status | File | Exact classes |
|---|---|---|---|
| AppShell | built | `src/components/AppShell.tsx` | `flex min-h-screen flex-col` · main: `flex-1 pb-8 md:pb-10` |
| ClientAppShell | built | `src/components/ClientAppShell.tsx` | none — `usePathname` wrapper around AppShell |
| TopAppBar | built | `src/components/TopAppBar.tsx` | `sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-outline-variant bg-surface px-container-margin-mobile py-stack-md shadow-sm md:px-container-margin-desktop` |
| NavigationDrawer | built | `src/components/NavigationDrawer.tsx` | nav item: `mx-2 mt-2 flex items-center gap-4 rounded-full px-6 py-3 text-on-surface-variant transition-all hover:bg-surface-variant` |
| FooterSection | built | `src/components/FooterSection.tsx` | `flex w-full lg:ml-72 lg:max-w-[calc(100%-18rem)] flex-col items-center justify-between gap-stack-md border-t border-outline-variant bg-surface-container-highest px-container-margin-mobile py-stack-lg md:flex-row md:px-container-margin-desktop` |
| ~~MobileBottomNav~~ | **🗑️ delete (D-3)** | `src/components/MobileBottomNav.tsx` | Non-functional scaffolding — hardcoded `Home/Search/Alerts/Profile` `<div>`s, no links, no routing, static `active` flag. Destinations don't exist in this app. Do **not** reuse; a real bottom nav is Phase 1.1. |
| ~~RoleSwitcher~~ | **🗑️ delete (D-3)** | `src/components/RoleSwitcher.tsx` | Non-functional scaffolding — local `useState` that calls nothing, using lowercase role strings that don't match the `UserRole` enum. |
| *Page shell wrapper* | **not extracted** | — | `min-h-screen lg:ml-72` — **repeated verbatim in 10 page components**. Should be one component (B-18) |

`AppShell` renders TopAppBar → NavigationDrawer → main → FooterSection. It does **not** render `MobileBottomNav`, which is why that component is orphaned.

---

## 3. Data Display

| Component | Status | File | Exact classes |
|---|---|---|---|
| UsersTable | built | `src/features/admin/users/components/UsersTable.tsx` | `overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm` |
| UsersStatsSection | built | `src/features/admin/users/components/UsersStatsSection.tsx` | `grid gap-4 sm:grid-cols-2 xl:grid-cols-4` |
| CommodityTable | built | `src/features/commodity/components/CommodityTable.tsx` | `flex min-h-105 flex-1 flex-col rounded-3xl border border-outline-variant bg-white p-6 data-card-shadow md:p-8` |
| CommoditySummaryCards | built | `src/features/commodity/components/CommoditySummaryCards.tsx` | `flex flex-wrap gap-6` |
| PriceRecordsTable | built | `src/features/officer/components/PriceRecordsTable.tsx` | row actions: `flex flex-wrap items-center gap-2` |
| StoreCard | built | `src/features/officer/components/StoreCard.tsx` | title: `mb-1 truncate font-h3-desktop text-h3-desktop text-on-surface` (compact variant: `text-sm font-semibold`) |
| StoreRegistryGrid | built | `src/features/officer/components/StoreRegistryGrid.tsx` | empty state: `rounded-2xl border border-dashed border-outline-variant bg-white p-8 text-center text-body-md text-on-surface-variant` — ⚠️ `text-body-md` **is not defined** in `globals.css` (B-19) |
| StoreRegistryHeader | built | `src/features/officer/components/StoreRegistryHeader.tsx` | `mb-2 flex items-center gap-2 text-primary` |
| RecentReportCard | built | `src/features/officer/reports/components/RecentReportCard.tsx` | `rounded-3xl border border-outline-variant bg-white p-5` |
| ReportTypeCard | built | `src/features/officer/reports/components/ReportTypeCard.tsx` | badge: `absolute right-4 top-4` |
| HeroSection | built | `src/features/dashboard/HeroSection.tsx` | `relative overflow-hidden bg-white px-container-margin-mobile py-16 md:px-container-margin-desktop md:py-24` |
| SummaryStats | built | `src/features/dashboard/SummaryStats.tsx` | `bg-surface-container-low px-container-margin-mobile py-12 md:px-container-margin-desktop` |
| FeaturedSection | built **⚠️ orphaned** | `src/features/dashboard/FeaturedSection.tsx` | `px-container-margin-mobile py-12 md:px-container-margin-desktop` |
| TopCommoditiesGrid | built **⚠️ orphaned** | `src/features/dashboard/TopCommoditiesGrid.tsx` | `px-container-margin-mobile py-12 md:px-container-margin-desktop` |
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
| FieldError | built | `src/features/officer/components/FieldError.tsx` | `mt-1 text-xs font-medium text-error` |
| PriceRecordForm | built | `src/features/officer/components/PriceRecordForm.tsx` | `mx-auto w-full max-w-3xl rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)]` — ⚠️ arbitrary inline shadow |
| PriceRecordFilters | built | `src/features/officer/components/PriceRecordFilters.tsx` | `grid gap-4 rounded-3xl border border-outline-variant bg-white p-5 data-card-shadow md:p-6` |
| UsersSearchFilters | built | `src/features/admin/users/components/UsersSearchFilters.tsx` | `flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between` |
| StoreRegistryToolbar | built | `src/features/officer/components/StoreRegistryToolbar.tsx` | `rounded-2xl border border-outline-variant bg-white p-6 shadow-sm` |

`FieldError` is the shared validation-message component. It currently lives under `features/officer/` but is used across features — it belongs in `shared/components/` (B-20).

Forms use `react-hook-form` + Zod resolvers. There is no shared `Input` / `Select` / `FormGroup` component; field markup is repeated per form (B-21).

---

## 6. Actions & Buttons

| Component | Status | File | Exact classes |
|---|---|---|---|
| ExportFormatButton | built | `src/features/officer/reports/components/ExportFormatButton.tsx` | label: `text-body-sm font-semibold` |
| *Button* | **not extracted** | — | No shared Button component exists. Primary/secondary button classes are repeated inline across every page (B-21) |

---

## 7. Feedback & Overlays

| Component | Status | File | Exact classes |
|---|---|---|---|
| AddUserDialog | built | `src/features/admin/users/components/AddUserDialog.tsx` | error text: `mt-1 text-xs font-medium text-error` |
| AddCommodityDialog | built | `src/features/commodity/components/AddCommodityDialog.tsx` | error text: `mt-1 text-xs font-medium text-error` |
| CommodityDetailsDialog | built **⚠️ orphaned** | `src/features/commodity/components/CommodityDetailsDialog.tsx` | overlay: `fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm` |
| UpdateSrpDialog | built | `src/features/commodity/components/UpdateSrpDialog.tsx` | overlay: `fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm` |
| CreateStoreDialog | built | `src/features/officer/components/CreateStoreDialog.tsx` | overlay: `fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm` |
| StorePriceRecordsModal | built | `src/features/officer/store/StorePriceRecordsModal.tsx` | overlay: `fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm` |
| ForecastDetailModal | built | `src/features/public/components/price-analysis/ForecastDetailModal.tsx` | overlay: `fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6` — ⚠️ diverges from the other five |
| *Modal shell* | **not extracted** | — | The overlay recipe is duplicated in 5 modals; `bg-slate-950/40` is a non-token color (B-22) |
| Toast | **not implemented** | — | [build-plan.md](build-plan.md) Definition of Done requires visible write feedback; there is none (B-23) |
| Alert | **not implemented** | — | (B-23) |
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
| DashboardPage | built | `src/features/dashboard/DashboardPage.tsx` |
| AdminDashboardPage | built | `src/features/admin/components/AdminDashboardPage.tsx` |
| UsersManagementPage | built | `src/features/admin/users/components/UsersManagementPage.tsx` |
| UsersManagementPage *(duplicate)* | built **⚠️ orphaned** | `src/features/admin/components/UsersManagementPage.tsx` |
| CommodityManagementPage | built | `src/features/commodity/CommodityManagementPage.tsx` |
| CommodityListPage | built | `src/features/commodity/CommodityListPage.tsx` |
| MonitoringOfficerDashboardPage | built | `src/features/officer/MonitoringOfficerDashboardPage.tsx` |
| PriceRecordsPage | built | `src/features/officer/PriceRecordsPage.tsx` |
| StoreRegistryPage | built | `src/features/officer/StoreRegistryPage.tsx` |
| ReportGenerationPage | built | `src/features/officer/reports/ReportGenerationPage.tsx` |
| ReportGenerationPage *(duplicate)* | built **⚠️ orphaned** | `src/features/officer/ReportGenerationPage.tsx` |
| PriceAnalysisPage | built | `src/features/public/PriceAnalysisPage.tsx` |
| PublicUserDashboardPage | built **⚠️ orphaned** | `src/features/public/PublicUserDashboardPage.tsx` |

---

## Change Log

| Date | Component(s) | Change |
|---|---|---|
| 2026-08-13 | All | Registry populated from the existing codebase — 43 components catalogued, 8 flagged orphaned, 6 shared primitives identified as missing. |
| 2026-08-13 | MobileBottomNav, RoleSwitcher | Marked 🗑️ delete per D-3 — both inspected and found to be non-functional template scaffolding, not usable components. |
