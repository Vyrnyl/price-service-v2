import { prisma } from '../../prisma';
import type { Prisma } from '@prisma/client';
import type { ListUsersQuery } from './user.schema';
import { toSkipTake } from '../../shared/schema/pagination.schema';

export type CreateUserInput = Prisma.UserCreateInput;
export type UpdateUserInput = Prisma.UserUpdateInput;

export const userRepository = {
  create: (data: CreateUserInput) =>
    prisma.user.create({ data }),

  findAll: async (query: ListUsersQuery) => {
    const { page, pageSize, search, role, isActive } = query;
    const { skip, take } = toSkipTake({ page, pageSize });

    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.user.count({ where }),
    ]);

    return { data, total, page, pageSize };
  },

  findByEmail: (email: string) =>
    prisma.user.findUnique({ where: { email } }),

  findById: (id: string) =>
    prisma.user.findUnique({ where: { id } }),

  update: (id: string, data: UpdateUserInput) =>
    prisma.user.update({ where: { id }, data }),

  delete: (id: string) =>
    prisma.user.delete({ where: { id } }),
};
