"use client";

import { useEffect, useState } from "react";
import {
  MdOutlineFactCheck,
  MdOutlineGroup,
  MdOutlinePersonAdd,
  MdOutlineShield,
  MdOutlineVisibility,
} from "react-icons/md";
import { createUser, getUsers, updateUser, updateUserStatus } from "../services/users.api";
import { ApiError } from "../../../../shared/services/api";
import { useToast } from "@/shared/components/Toast";
import { useCurrentUser } from "@/shared/hooks/use-current-user";
import PageShell from "@/shared/components/PageShell";
import Pagination from "@/shared/components/Pagination";
import type { CreateUserFormSchema, UpdateUserFormSchema } from "../schemas/users.schema";
import type { User, UserRole } from "../types/users.types";
import AddUserDialog from "../components/AddUserDialog";
import UsersSearchFilters from "../components/UsersSearchFilters";
import UsersStatsSection from "../components/UsersStatsSection";
import UsersTable from "../components/UsersTable";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [userStats, setUserStats] = useState({ total: 0, admins: 0, officers: 0, active: 0 });
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const { showToast } = useToast();
  const currentUser = useCurrentUser();

  const totalUsers = userStats.total;
  const adminCount = userStats.admins;
  const officerCount = userStats.officers;
  const activeUsersCount = userStats.active;

  const stats = [
    {
      label: "Total Users",
      value: String(totalUsers),
      trend: `${totalUsers} accounts`,
      icon: MdOutlineGroup,
      accent: "text-primary bg-primary-fixed",
      trendTone: "text-secondary",
    },
    {
      label: "Admins",
      value: String(adminCount),
      trend: `${adminCount} admin accounts`,
      icon: MdOutlineShield,
      accent: "text-primary bg-primary-fixed",
      trendTone: "text-on-surface-variant",
    },
    {
      label: "Officers",
      value: String(officerCount),
      trend: `${officerCount} officer accounts`,
      icon: MdOutlineFactCheck,
      accent: "text-secondary bg-secondary-fixed",
      trendTone: "text-on-surface-variant",
    },
    {
      label: "Active Users",
      value: String(activeUsersCount),
      trend: `${activeUsersCount} active accounts`,
      icon: MdOutlineVisibility,
      accent: "text-tertiary bg-tertiary-fixed",
      trendTone: "text-on-surface-variant",
    },
  ];

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  const loadUsers = async (targetPage: number) => {
    try {
      const response = await getUsers({
        page: targetPage,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        isActive: showActiveOnly ? true : undefined,
      });
      setUsers(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to load users", error);
    }
  };

  useEffect(() => {
    async function run() {
      await loadUsers(page);
    }
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, roleFilter, showActiveOnly]);

  const loadStats = async () => {
    try {
      const [totalResponse, adminResponse, officerResponse, activeResponse] = await Promise.all([
        getUsers({ pageSize: 1 }),
        getUsers({ pageSize: 1, role: "ADMIN" }),
        getUsers({ pageSize: 1, role: "OFFICER" }),
        getUsers({ pageSize: 1, isActive: true }),
      ]);
      setUserStats({
        total: totalResponse.total,
        admins: adminResponse.total,
        officers: officerResponse.total,
        active: activeResponse.total,
      });
    } catch (error) {
      console.error("Failed to load user stats", error);
    }
  };

  useEffect(() => {
    async function run() {
      await loadStats();
    }
    void run();
  }, []);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const getRoleClass = (role: UserRole) => {
    if (role === "ADMIN") {
      return "border border-primary/20 bg-primary-fixed text-primary";
    }

    return "border border-outline-variant bg-surface-container-high text-on-surface-variant";
  };

  const handleSubmitUser = async (
    data: CreateUserFormSchema | UpdateUserFormSchema,
  ) => {
    setFormError(null);
    setFormSuccess(null);
    setSubmitLoading(true);

    try {
      if (editingUser) {
        await updateUser(editingUser.id, data as UpdateUserFormSchema);
        setFormSuccess("User updated successfully.");
        showToast("User updated successfully.", "success");
        await loadUsers(page);
      } else {
        const createPayload = data as CreateUserFormSchema;

        await createUser({
          ...createPayload,
          role: createPayload.role ?? "OFFICER",
          isActive: createPayload.isActive ?? true,
        });
        setFormSuccess("User created successfully.");
        showToast("User created successfully.", "success");
        setPage(1);
        await loadUsers(1);
      }
      await loadStats();
      setFormOpen(false);
      setEditingUser(null);
    } catch (error: unknown) {
      if (error instanceof ApiError && typeof error.message === "string") {
        setFormError(error.message);
      } else if (typeof error === "object" && error !== null && "message" in error) {
        setFormError(String((error as { message: unknown }).message));
      } else {
        setFormError("Unable to save user. Please check the information and try again.");
        console.error(error);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormError(null);
    setFormSuccess(null);
    setFormOpen(true);
  };

  const handleToggleActive = async (user: User) => {
    if (currentUser && user.id === currentUser.id) {
      return;
    }

    try {
      const updatedUser = await updateUserStatus(user.id, !user.isActive);
      showToast(
        updatedUser.isActive ? `${updatedUser.name} activated.` : `${updatedUser.name} deactivated.`,
        "success",
      );
      await Promise.all([loadUsers(page), loadStats()]);
    } catch (error) {
      console.error("Failed to update user status", error);
      showToast("Unable to update user status. Please try again.", "error");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <PageShell>
      <section className="px-container-margin-mobile py-8 sm:py-10 md:px-container-margin-desktop md:py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-sans text-h1-desktop text-on-surface mobile:font-sans mobile:text-h1-mobile">
                System Access
              </h1>
              <p className="mt-1 text-body-lg text-on-surface-variant">
                Manage institutional roles and monitor authentication activity across the platform.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingUser(null);
                setFormError(null);
                setFormSuccess(null);
                setFormOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary transition-all hover:shadow-md active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:w-auto"
            >
              <MdOutlinePersonAdd size={20} />
              <span>Add New User</span>
            </button>
          </div>

          <AddUserDialog
            open={formOpen}
            mode={editingUser ? "edit" : "create"}
            defaultValues={
              editingUser
                ? {
                    name: editingUser.name,
                    email: editingUser.email,
                    password: "",
                    confirmPassword: "",
                    role: editingUser.role,
                    isActive: editingUser.isActive,
                  }
                : undefined
            }
            formError={formError}
            formSuccess={formSuccess}
            submitLoading={submitLoading}
            onClose={() => {
              setFormOpen(false);
              setFormError(null);
              setEditingUser(null);
            }}
            onSubmit={handleSubmitUser}
          />

          <UsersStatsSection stats={stats} />

          <UsersSearchFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            roleFilter={roleFilter}
            onRoleFilterChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
            showActiveOnly={showActiveOnly}
            onActiveFilterChange={(value) => {
              setShowActiveOnly(value);
              setPage(1);
            }}
          />

          <UsersTable
            users={users}
            onEdit={handleEditUser}
            onToggleActive={handleToggleActive}
            getInitials={getInitials}
            getRoleClass={getRoleClass}
            currentUserId={currentUser?.id}
          />

          {total > PAGE_SIZE ? (
            <div className="flex flex-col gap-3 border-t border-outline-variant pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-body-xs text-on-surface-variant">
                Showing {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, total)} of {total} users
              </p>
              <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} size="sm" />
            </div>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
