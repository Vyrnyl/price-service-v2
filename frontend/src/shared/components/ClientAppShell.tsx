"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AppShell from "./AppShell";

export default function ClientAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activePath = pathname || "/";
  const hideNavigation = pathname === "/login" || pathname.startsWith("/login/");

  return (
    <AppShell activePath={activePath} hideNavigation={hideNavigation}>
      {children}
    </AppShell>
  );
}
