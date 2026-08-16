import type { User } from '@prisma/client';

export interface UserProfileDto {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OFFICER';
}

export function toUserProfileDto(user: Pick<User, 'id' | 'name' | 'email' | 'role'>): UserProfileDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OFFICER';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toAdminUserDto(
  user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'isActive' | 'createdAt' | 'updatedAt'>,
): AdminUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
