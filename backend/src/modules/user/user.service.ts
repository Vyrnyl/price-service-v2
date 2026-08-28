import AppError from '../../shared/utils/AppError';
import { passwordUtils } from '../../shared/utils/password.utils';
import { userRepository } from './user.repository';
import { toAdminUserDto, toUserProfileDto } from './user.types';
import type { ChangePasswordInput, CreateUserInput, ListUsersQuery, UpdateProfileInput, UpdateUserInput } from './user.schema';

export const userService = {
  createUser: async (data: CreateUserInput) => {
    const existingUser = await userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new AppError('Email already exists', 409);
    }

    const hashedPassword = await passwordUtils.hashPassword(data.password);

    const { confirmPassword, ...createData } = data;

    const created = await userRepository.create({
      ...createData,
      password: hashedPassword,
    });

    return toAdminUserDto(created);
  },

  getUsers: async (query: ListUsersQuery) => {
    const { data, total, page, pageSize } = await userRepository.findAll(query);
    return { data: data.map(toAdminUserDto), total, page, pageSize };
  },

  getUserById: async (id: string) => {
    const user = await userRepository.findById(id);
    return user ? toAdminUserDto(user) : null;
  },

  updateUser: async (id: string, data: UpdateUserInput) => {
    if (typeof data.email === 'string') {
      const existingUser = await userRepository.findByEmail(data.email);

      if (existingUser && existingUser.id !== id) {
        throw new AppError('Email already exists', 409);
      }
    }

    let updateData = { ...data };
    if (typeof data.password === "string") {
      const hashedPassword = await passwordUtils.hashPassword(data.password);
      updateData = {
        ...updateData,
        password: hashedPassword,
      };
    }

    const { confirmPassword, ...finalData } = updateData;

    const updated = await userRepository.update(id, finalData);
    return toAdminUserDto(updated);
  },

  deleteUser: (id: string) => userRepository.delete(id),

  getCurrentUser: async (id: string) => {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return toUserProfileDto(user);
  },

  updateProfile: async (id: string, data: UpdateProfileInput) => {
    const existingUser = await userRepository.findByEmail(data.email);

    if (existingUser && existingUser.id !== id) {
      throw new AppError('Email already exists', 409);
    }

    const updated = await userRepository.update(id, { name: data.name, email: data.email });
    return toUserProfileDto(updated);
  },

  changePassword: async (id: string, data: ChangePasswordInput) => {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const currentPasswordMatches = await passwordUtils.comparePassword(data.currentPassword, user.password);

    if (!currentPasswordMatches) {
      throw new AppError('Current password is incorrect', 401);
    }

    const hashedPassword = await passwordUtils.hashPassword(data.newPassword);
    await userRepository.update(id, { password: hashedPassword });
  },
};
