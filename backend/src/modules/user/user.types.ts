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
