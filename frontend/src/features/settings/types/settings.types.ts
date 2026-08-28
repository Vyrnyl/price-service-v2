export type UserRole = "ADMIN" | "OFFICER";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface ProfileFormValues {
  name: string;
  email: string;
}

export interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
