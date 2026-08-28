"use client";

import { useEffect, useState } from "react";
import TopAppBar from "./TopAppBar";
import NavigationDrawer from "./NavigationDrawer";
import FooterSection from "./FooterSection";

export default function AppShell({
  children,
  activePath,
  hideNavigation,
}: {
  children: React.ReactNode;
  activePath: string;
  hideNavigation?: boolean;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    // Close the mobile drawer when the active path changes.
    // Schedule the state update asynchronously to avoid calling setState
    // synchronously inside the effect body (ESLint: react-hooks/set-state-in-effect).
    const t = setTimeout(() => setIsDrawerOpen(false), 0);
    return () => clearTimeout(t);
  }, [activePath]);

  return (
    <div className="flex min-h-screen flex-col">
      <TopAppBar
        activePath={activePath}
        isMenuOpen={isDrawerOpen}
        onMenuToggle={() => setIsDrawerOpen((prev) => !prev)}
        showMenuButton={!hideNavigation}
      />
      {!hideNavigation && (
        <NavigationDrawer
          activePath={activePath}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}
      <main className="flex-1 pb-8 md:pb-10">
        {children}
      </main>
      <FooterSection />
    </div>
  );
}
