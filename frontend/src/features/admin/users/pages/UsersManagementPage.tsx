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
import type { CreateUserFormSchema, UpdateUserFormSchema } from "../schemas/users.schema";
import type { User, UserRole } from "../types/users.types";
import AddUserDialog from "../components/AddUserDialog";
import UsersSearchFilters from "../components/UsersSearchFilters";
import UsersStatsSection from "../components/UsersStatsSection";
import UsersTable from "../components/UsersTable";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const { showToast } = useToast();

  const totalUsers = users.length;
  const adminCount = users.filter((user) => user.role === "ADMIN").length;
  const officerCount = users.filter((user) => user.role === "OFFICER").length;
  const activeUsersCount = users.filter((user) => user.isActive).length;

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
    const loadUsers = async () => {
      try {
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Failed to load users", error);
      }
    };

    loadUsers();
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
        const updatedUser = await updateUser(editingUser.id, data as UpdateUserFormSchema);
        setUsers((prev) => prev.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
        setFormSuccess("User updated successfully.");
        showToast("User updated successfully.", "success");
      } else {
        const createPayload = data as CreateUserFormSchema;

        const createdUser = await createUser({
          ...createPayload,
          role: createPayload.role ?? "OFFICER",
          isActive: createPayload.isActive ?? true,
        });
        setUsers((prev) => [createdUser, ...prev]);
        setFormSuccess("User created successfully.");
        showToast("User created successfully.", "success");
      }
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
    try {
      const updatedUser = await updateUserStatus(user.id, !user.isActive);
      setUsers((prev) => prev.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
      showToast(
        updatedUser.isActive ? `${updatedUser.name} activated.` : `${updatedUser.name} deactivated.`,
        "success",
      );
    } catch (error) {
      console.error("Failed to update user status", error);
      showToast("Unable to update user status. Please try again.", "error");
    }
  };

  const filteredUsers = users.filter((user) => {
    const haystack = `${user.name} ${user.email} ${user.role}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesActive = !showActiveOnly || user.isActive;

    return matchesSearch && matchesRole && matchesActive;
  });

  return (
    <main className="min-h-screen lg:ml-72">
      <section className="px-container-margin-mobile py-8 sm:py-10 md:px-container-margin-desktop md:py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-h1-desktop text-h1-desktop text-on-surface mobile:font-h1-mobile mobile:text-h1-mobile">
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary transition-all hover:shadow-md active:scale-[0.98] md:w-auto"
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
            onRoleFilterChange={setRoleFilter}
            showActiveOnly={showActiveOnly}
            onActiveFilterChange={setShowActiveOnly}
          />

          <UsersTable
            users={filteredUsers}
            onEdit={handleEditUser}
            onToggleActive={handleToggleActive}
            getInitials={getInitials}
            getRoleClass={getRoleClass}
          />
        </div>
      </section>
    </main>
  );
}
