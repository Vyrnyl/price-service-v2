"use client";

import Link from "next/link";
import { MdOutlineAnalytics, MdMenu, MdClose } from "react-icons/md";
import { LuLogIn } from "react-icons/lu";
import { useEffect, useState } from "react";
import { getSessionUser, type SessionUser } from "@/shared/services/auth";

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
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let mounted = true;
    getSessionUser().then((user) => {
      if (mounted) setSessionUser(user);
    });
    return () => {
      mounted = false;
    };
  }, [activePath]);

  const showLoginButton = !sessionUser && activePath !== "/login";

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-outline-variant bg-surface px-container-margin-mobile py-stack-md shadow-sm md:px-container-margin-desktop">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {showMenuButton ? (
          <button
            type="button"
            onClick={onMenuToggle}
            className="shrink-0 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-variant focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {isMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
          </button>
        ) : null}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <MdOutlineAnalytics className="shrink-0 text-primary" size={28} />
          <h1 className="truncate font-sans text-h2-desktop font-bold text-primary">
            PresyoSerbisyo
          </h1>
        </Link>
      </div>
      <div className="shrink-0">
        {showLoginButton ? (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 py-2 font-sans text-label-caps text-on-primary transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <LuLogIn size={14} />
            <span>LOGIN</span>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
