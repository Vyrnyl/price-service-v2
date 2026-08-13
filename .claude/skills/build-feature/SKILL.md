---
name: build-feature
description: Build a feature using the mandatory UI-first Feature Loop — full page with mock data and visual sign-off BEFORE any logic is wired. Use whenever implementing a feature, page, or screen from the build plan (e.g. "build the settings page", "implement authentication", "start Phase 1", "let's do the dashboard", "next feature"). Enforces the gates so no invisible backend work happens.
---

# Build Feature

Implements one feature through the six-step Feature Loop in [build-plan.md](../../../context/build-plan.md) §1.

> **The rule this enforces:** full page UI with mock data, visually verified by a human, *before* any logic is written. Every feature must be visible and testable before moving on. **No invisible backend phases.**

## Before starting

1. Read the feature's entry in [build-plan.md](../../../context/build-plan.md) — scope, screens, endpoints, Done gate.
2. Read its entry in [progress.md](../../../context/progress.md) — it may already be partway through the loop. **Resume at the recorded step; do not restart.**
3. Confirm prerequisites are done (sequencing rules, [build-plan.md](../../../context/build-plan.md) §5) — anything depending on earlier features, and Phase 0.
4. Check for blockers or open decisions gating this feature. Raise them now, not halfway through.

## The Loop — do not skip or reorder

### Step 1 — UI + Mock (◔)
- Build the **complete** page/screen with realistic hardcoded mock data.
- **Check [ui-registry.md](../../../context/ui-registry.md) first.** If a component exists, match its exact classes. Only build new ones when nothing fits — then register them.
- Follow [ui-rules.md](../../../context/ui-rules.md) for tokens, spacing, variants.
- Mock data goes in `src/shared/mocks/<feature>.mock.ts`.
- Draw loading, empty, and error states — not blank placeholders.
- No API calls, no business logic in this step.

### Step 2 — Visual Verify (◑) · **HUMAN GATE**
- Present the page for review; run it if a dev server is available.
- Check against [ui-rules.md](../../../context/ui-rules.md): layout, colors, typography, spacing. If the project has a prototype or design reference, compare side by side.
- Check responsive at **768px** and **480px**.
- Confirm loading/empty/error states render.
- **Stop and ask the user to confirm.** Do not proceed to step 3 on your own judgment — this gate requires human sign-off.

### Step 3 — Contract
- Define TypeScript types for the domain model and request/response shapes.
- Define API routes following `/api/v1/...` ([architecture.md](../../../context/architecture.md) §7).
- Make the mock data conform exactly to these types — the mock becomes the contract fixture.

### Step 4 — Wire Read (◕)
- Backend, in order: route → controller (thin) → service (logic) → repository (DB).
- Wrap async controllers in the singleton `asyncHandler`.
- Frontend: feature service module — **no direct fetch inside components** ([code-standards.md](../../../context/code-standards.md) §7.4).
- Replace mock with real fetch. Wire the loading/error/empty states to real conditions.
- **Real data must render on screen before continuing.**

### Step 5 — Wire Write (●)
- Create/update/delete endpoints + schema validation on **both** sides.
- Wire forms and modals; show a toast on success and an alert/field errors on failure.
- Refetch or update state so the change is immediately visible.

### Step 6 — Test & Done
- Apply RBAC middleware for the correct role(s).
- Unit-test the service layer's business logic.
- Manually walk the happy path **and** failure paths (invalid input, wrong role, empty result).
- Verify every item in the Definition of Done ([build-plan.md](../../../context/build-plan.md) §3).

## After the loop

- Update [progress.md](../../../context/progress.md): status, Loop step, screens, components, endpoints, files, remaining, session log entry.
- Update [ui-registry.md](../../../context/ui-registry.md) for any component built (real path, exact classes, status `built`).
- Report: what was built, what's visibly working, what's next.

## Hard rules

- Never write backend logic before step 2 passes.
- Never mark a feature done with mock data still in the render path.
- Never invent a component that already exists in the registry.
- Never start the next feature before this one meets its Done gate.
- If you must deviate, say so explicitly and explain why — don't silently skip a gate.
