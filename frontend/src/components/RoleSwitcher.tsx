"use client";

import { useState } from "react";
import { type UserRole } from "../lib/auth";

const roles: { value: UserRole; label: string }[] = [
  { value: "officer", label: "Monitoring Officer" },
  { value: "admin", label: "Admin" },
];

export default function RoleSwitcher() {
  const [role, setRole] = useState<UserRole>("officer");

  return (
    <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-2 py-1">
      {roles.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => setRole(item.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            role === item.value
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
