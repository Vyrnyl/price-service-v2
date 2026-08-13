"use client";

import Link from "next/link";
import { MdOutlineAnalytics, MdMenu, MdClose } from "react-icons/md";
import { LuLogIn } from "react-icons/lu";
import { useEffect, useState } from "react";
import { getRoleFromServer, type UserRole } from "@/lib/auth";

export default function TopAppBar({
  activePath,
  isMenuOpen,
  onMenuToggle,
  showMenuButton,
}: {
  activePath: string;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  showMenuButton: boolean;
}) {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    let mounted = true;
    getRoleFromServer().then((userRole) => {
      if (mounted) setRole(userRole);
    });
    return () => {
      mounted = false;
    };
  }, [activePath]);

  const showLoginButton = role !== "admin" && role !== "officer" && activePath !== "/login";

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-outline-variant bg-surface px-container-margin-mobile py-stack-md shadow-sm md:px-container-margin-desktop">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {showMenuButton ? (
          <button
            type="button"
            onClick={onMenuToggle}
            className="shrink-0 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-variant lg:hidden"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {isMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
          </button>
        ) : null}
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <MdOutlineAnalytics className="shrink-0 text-primary" size={28} />
          <h1 className="truncate font-h2-desktop text-h2-desktop font-bold text-primary">
            PresyoSerbisyo
          </h1>
        </Link>
      </div>
      <div className="shrink-0">
        {showLoginButton ? (
          <Link href="/login" className="inline-flex">
            <button className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 py-2 font-label-caps text-label-caps text-on-primary transition-opacity hover:opacity-90">
              <LuLogIn size={14} />
              <span>LOGIN</span>
            </button>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
