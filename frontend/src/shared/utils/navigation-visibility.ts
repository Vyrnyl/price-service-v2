/**
 * Single source of truth for whether a route renders the navigation drawer.
 *
 * The drawer is `position: fixed`, so it occupies no layout space and pushes
 * nothing aside. Every surface that sits beside it compensates manually with
 * `lg:ml-72`, and that compensation is only correct when the drawer is
 * actually on screen. Three places need the same answer -- `ClientAppShell`
 * (whether to render the drawer at all), `FooterSection`, and `PageShell` --
 * so the rule lives here rather than being restated in each of them, where
 * the copies could drift apart. Drift is exactly what produced the footer
 * offset bug fixed in 673d6c9.
 */
export function hidesNavigation(pathname: string | null): boolean {
  const path = pathname || "/";
  return path === "/login" || path.startsWith("/login/");
}
