"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  MdBarChart,
  MdOutlineDashboard,
  MdOutlineHistory,
  MdOutlineInventory2,
  MdOutlineLogout,
  MdOutlineSettings,
  MdOutlineStorefront,
  MdOutlineTrendingUp,
} from "react-icons/md";
import { HiUsers } from "react-icons/hi2";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { useRouter } from "next/navigation";
import {
  getSessionUser,
  logoutFromServer,
  type SessionUser,
  type UserRole,
} from "../services/auth";
import { useToast } from "./Toast";

type NavLink = { href: string; icon: React.ElementType; label: string };

const publicLinks: NavLink[] = [
  { href: "/", icon: MdOutlineDashboard, label: "Dashboard" },
  {
    href: "/commodity-list",
    icon: MdOutlineInventory2,
    label: "Commodity List",
  },
  {
    href: "/price-analysis",
    icon: MdOutlineTrendingUp,
    label: "Price Analysis",
  },
];

const roleSpecificLinks: Record<UserRole, NavLink[]> = {
  admin: [
    { href: "/admin", icon: MdOutlineDashboard, label: "Admin Dashboard" },
    {
      href: "/admin/commodities",
      icon: MdOutlineInventory2,
      label: "Commodities",
    },
    {
      href: "/admin/stores",
      icon: MdOutlineStorefront,
      label: "Stores",
    },
    { href: "/admin/users", icon: HiUsers, label: "Users" },
    {
      href: "/admin/price-records",
      icon: MdOutlineTrendingUp,
      label: "Price Records",
    },
    {
      href: "/admin/price-trends",
      icon: MdBarChart,
      label: "Price Trends",
    },
    {
      href: "/admin/audit-log",
      icon: MdOutlineHistory,
      label: "Audit Log",
    },
    {
      href: "/admin/reports",
      icon: HiOutlineDocumentReport,
      label: "Reports",
    },
    {
      href: "/admin/settings",
      icon: MdOutlineSettings,
      label: "Settings",
    },
  ],
  officer: [
    { href: "/officer", icon: MdOutlineDashboard, label: "Officer Dashboard" },
    {
      href: "/officer/commodities",
      icon: MdOutlineInventory2,
      label: "Commodities",
    },
    {
      href: "/officer/stores",
      icon: MdOutlineStorefront,
      label: "Store Registry",
    },
    {
      href: "/officer/price-records",
      icon: MdOutlineTrendingUp,
      label: "Price Records",
    },
    {
      href: "/officer/price-trends",
      icon: MdBarChart,
      label: "Price Trends",
    },
    {
      href: "/officer/settings",
      icon: MdOutlineSettings,
      label: "Settings",
    },
  ],
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function NavigationDrawer({
  activePath,
  isOpen,
  onClose,
}: {
  activePath: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [sessionUser, setSessionUser] = useState<SessionUser | null | undefined>(undefined);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    let mounted = true;
    getSessionUser().then((user) => {
      if (mounted) setSessionUser(user);
    });
    return () => {
      mounted = false;
    };
  }, [activePath]);

  const isLoading = sessionUser === undefined;
  const links = sessionUser ? roleSpecificLinks[sessionUser.role] : publicLinks;

  const handleLogout = async () => {
    try {
      await logoutFromServer();
    } catch (error) {
      console.error("Logout failed", error);
      showToast("Logout failed on the server, but you've been signed out on this device.", "error");
    }

    setSessionUser(null);
    router.push("/login");
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-inverse-surface/30 transition-opacity duration-200 lg:hidden ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed left-0 top-0 z-40 mt-16 flex h-[calc(100vh-4rem)] w-72 flex-col rounded-r-xl bg-surface-container shadow-lg transition-transform duration-200 ease-out lg:mt-0 lg:h-full lg:w-72 lg:translate-x-0 lg:rounded-none lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4">
          {sessionUser ? (
            <div className="mx-6 mt-16 flex items-center gap-3 rounded-xl border border-outline-variant p-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-lg font-bold text-primary">
                {getInitials(sessionUser.name)}
              </div>
              <p className="min-w-0 font-sans text-body-lg font-bold leading-snug text-on-surface">
                {sessionUser.name}
                <span className="text-primary"> - {sessionUser.role.toUpperCase()}</span>
              </p>
            </div>
          ) : (
            <h2 className="px-6 pt-8 font-sans text-label-caps uppercase tracking-widest text-outline">
              Navigation
            </h2>
          )}
        </div>
        {isLoading ? (
          <div className="px-6 py-4 text-sm text-on-surface-variant">
            Loading navigation...
          </div>
        ) : (
          <nav className="flex flex-col gap-2">
            {links.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`mx-2 flex items-center gap-4 rounded-full px-6 py-3 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isActive
                    ? "bg-secondary-container text-on-secondary-container"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                <Icon />
                <span className="font-sans text-body-sm">{item.label}</span>
              </Link>
            );
          })}
            {sessionUser ? (
              <button
                type="button"
                onClick={handleLogout}
                className="mx-2 mt-2 flex items-center gap-4 rounded-full px-6 py-3 text-on-surface-variant transition-all hover:bg-surface-variant focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <MdOutlineLogout />
                <span className="font-sans text-body-sm">Logout</span>
              </button>
            ) : null}
            <hr className="mx-6 my-4 border-outline-variant" />
          </nav>
        )}
      </aside>
    </>
  );
}
