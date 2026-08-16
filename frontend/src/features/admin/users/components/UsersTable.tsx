"use client";

import { useMemo, useState } from "react";
import { MdOutlineEdit, MdOutlinePersonOff, MdOutlinePerson2 } from "react-icons/md";
import Pagination from "@/shared/components/Pagination";
import type { User, UserRole } from "../types/users.types";

type UsersTableProps = {
  users: User[];
  onToggleActive: (user: User) => void;
  onEdit: (user: User) => void;
  getInitials: (name: string) => string;
  getRoleClass: (role: UserRole) => string;
};

const PAGE_SIZE = 5;

export default function UsersTable({ users, onToggleActive, onEdit, getInitials, getRoleClass }: UsersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return users.slice(startIndex, startIndex + PAGE_SIZE);
  }, [safeCurrentPage, users]);

  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(startIndex + paginatedUsers.length - 1, users.length);

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest data-card-shadow">
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <th className="px-6 py-4 text-label-caps uppercase text-outline">User Details</th>
                <th className="px-6 py-4 text-label-caps uppercase text-outline">Role</th>
                <th className="px-6 py-4 text-label-caps uppercase text-outline">Status</th>
                <th className="px-6 py-4 text-right text-label-caps uppercase text-outline">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high font-bold text-primary">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="text-body-sm font-semibold leading-none text-on-surface">{user.name}</p>
                        <p className="mt-1 text-body-xs text-outline">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-label-caps font-semibold ${getRoleClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`flex items-center gap-2 text-body-sm font-semibold ${
                        user.isActive ? "text-secondary" : "text-outline"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${user.isActive ? "bg-secondary" : "bg-outline"}`} />
                      {user.isActive ? "Active" : "Inactive"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-60 transition-opacity group-hover:opacity-100">
                      <button
                        className="rounded-lg p-2 transition-colors hover:bg-surface-container-high hover:text-on-surface"
                        title="Edit user"
                        onClick={() => onEdit(user)}
                      >
                        <MdOutlineEdit size={18} />
                      </button>
                      <button
                        className="rounded-lg p-2 transition-colors hover:bg-error-container hover:text-error"
                        title={user.isActive ? "Deactivate user" : "Activate user"}
                        onClick={() => onToggleActive(user)}
                      >
                        {user.isActive ? <MdOutlinePersonOff size={18} /> : <MdOutlinePerson2 size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {paginatedUsers.map((user) => (
          <div key={user.id} className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high font-bold text-primary">
                  {getInitials(user.name)}
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-on-surface">{user.name}</p>
                  <p className="mt-1 text-body-xs text-outline">{user.email}</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-label-caps font-semibold ${getRoleClass(user.role)}`}>
                {user.role}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className={`flex items-center gap-2 rounded-full px-2.5 py-1 font-semibold ${user.isActive ? "bg-secondary/10 text-secondary" : "bg-surface-container-high text-outline"}`}>
                <span className={`h-2 w-2 rounded-full ${user.isActive ? "bg-secondary" : "bg-outline"}`} />
                {user.isActive ? "Active" : "Inactive"}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="rounded-lg border border-outline-variant bg-surface-container-lowest p-2.5 transition-colors hover:bg-surface-container-high"
                title="Edit user"
                onClick={() => onEdit(user)}
              >
                <MdOutlineEdit size={18} />
              </button>
              <button
                className="rounded-lg border border-outline-variant bg-surface-container-lowest p-2.5 transition-colors hover:bg-error-container hover:text-error"
                title={user.isActive ? "Deactivate user" : "Activate user"}
                onClick={() => onToggleActive(user)}
              >
                {user.isActive ? <MdOutlinePersonOff size={18} /> : <MdOutlinePerson2 size={18} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface-container-low px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-sm text-on-surface-variant">
          Showing {users.length === 0 ? 0 : `${startIndex}-${endIndex}`} of {users.length} users
        </p>
        <Pagination currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
