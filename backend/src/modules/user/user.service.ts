import AppError from '../../shared/utils/AppError';
import { passwordUtils } from '../../shared/utils/password.utils';
import { CreateUserInput, UpdateUserInput, userRepository } from './user.repository';

export const userService = {
  createUser: async (data: CreateUserInput) => {
    const existingUser = await userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new AppError('Email already exists', 409);
    }

    const hashedPassword = await passwordUtils.hashPassword(data.password);

    const { confirmPassword, ...createData } = data as CreateUserInput & { confirmPassword?: string };

    return userRepository.create({
      ...createData,
      password: hashedPassword,
    });
  },

  getUsers: () => userRepository.findAll(),
  getUserById: (id: string) => userRepository.findById(id),

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

    const { confirmPassword, ...finalData } = updateData as UpdateUserInput & { confirmPassword?: string };

    return userRepository.update(id, finalData);
  },

  deleteUser: (id: string) => userRepository.delete(id),
};
