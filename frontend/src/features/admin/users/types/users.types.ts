export type UserRole = "ADMIN" | "OFFICER";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastActive?: string;
};

export type AddUserForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  isActive: boolean;
};
