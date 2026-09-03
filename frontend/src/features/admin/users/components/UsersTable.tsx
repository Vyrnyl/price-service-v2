"use client";

import { useMemo, useState } from "react";
import { MdOutlineEdit, MdOutlinePersonOff, MdOutlinePerson2 } from "react-icons/md";
import Pagination from "@/shared/components/Pagination";
import Skeleton from "@/shared/components/Skeleton";
import type { User, UserRole } from "../types/users.types";

type UsersTableProps = {
  users: User[];
  isLoading?: boolean;
  onToggleActive: (user: User) => void;
  onEdit: (user: User) => void;
  getInitials: (name: string) => string;
  getRoleClass: (role: UserRole) => string;
  currentUserId?: string;
};

const PAGE_SIZE = 5;

export default function UsersTable({ users, isLoading = false, onToggleActive, onEdit, getInitials, getRoleClass, currentUserId }: UsersTableProps) {
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
              {isLoading ? (
                Array.from({ length: 5 }, (_, index) => index).map((row) => (
                  <tr key={row}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedUsers.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
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
                        type="button"
                        className="rounded-lg p-2 transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        title="Edit user"
                        onClick={() => onEdit(user)}
                      >
                        <span className="sr-only">Edit user</span>
                        <MdOutlineEdit size={18} />
                      </button>
                      <button
                        type="button"
                        disabled={isSelf}
                        className="rounded-lg p-2 transition-colors hover:bg-error-container hover:text-on-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-inherit"
                        title={isSelf ? "You cannot deactivate your own account" : user.isActive ? "Deactivate user" : "Activate user"}
                        onClick={() => onToggleActive(user)}
                      >
                        <span className="sr-only">{user.isActive ? "Deactivate user" : "Activate user"}</span>
                        {user.isActive ? <MdOutlinePerson2 size={18} /> : <MdOutlinePersonOff size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {isLoading
          ? Array.from({ length: 5 }, (_, index) => index).map((row) => (
              <div key={row} className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
              </div>
            ))
          : paginatedUsers.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
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
                type="button"
                className="rounded-lg border border-outline-variant bg-surface-container-lowest p-2.5 transition-colors hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                title="Edit user"
                onClick={() => onEdit(user)}
              >
                <span className="sr-only">Edit user</span>
                <MdOutlineEdit size={18} />
              </button>
              <button
                type="button"
                disabled={isSelf}
                className="rounded-lg border border-outline-variant bg-surface-container-lowest p-2.5 transition-colors hover:bg-error-container hover:text-on-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface-container-lowest disabled:hover:text-inherit"
                title={isSelf ? "You cannot deactivate your own account" : user.isActive ? "Deactivate user" : "Activate user"}
                onClick={() => onToggleActive(user)}
              >
                <span className="sr-only">{user.isActive ? "Deactivate user" : "Activate user"}</span>
                {user.isActive ? <MdOutlinePerson2 size={18} /> : <MdOutlinePersonOff size={18} />}
              </button>
            </div>
          </div>
          );
        })}
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
