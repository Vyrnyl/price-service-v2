"use client";

import { usePathname } from "next/navigation";
import type { HTMLAttributes, ReactNode } from "react";
import { hidesNavigation } from "@/shared/utils/navigation-visibility";

interface PageShellProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export default function PageShell({ className = "", children, ...rest }: PageShellProps) {
  // The drawer is `fixed` and so pushes nothing aside; `ml-72` is a manual
  // compensation that may only apply where the drawer is actually rendered.
  // Derived from the same rule that decides whether it renders at all, so the
  // two cannot drift -- see navigation-visibility.ts.
  const offsetForSidebar = !hidesNavigation(usePathname());

  return (
    <main
      className={`min-h-screen ${offsetForSidebar ? "lg:ml-72" : ""} ${className}`
        .replace(/\s+/g, " ")
        .trim()}
      {...rest}
    >
      {children}
    </main>
  );
}
