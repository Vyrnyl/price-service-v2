"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AppShell from "./AppShell";
import { hidesNavigation } from "@/shared/utils/navigation-visibility";

export default function ClientAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activePath = pathname || "/";
  const hideNavigation = hidesNavigation(pathname);

  return (
    <AppShell activePath={activePath} hideNavigation={hideNavigation}>
      {children}
    </AppShell>
  );
}
