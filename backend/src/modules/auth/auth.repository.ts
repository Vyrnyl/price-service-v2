import { prisma } from '../../prisma';

export interface CreateRefreshTokenInput {
  userId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
}

export const authRepository = {
  createRefreshToken: (data: CreateRefreshTokenInput) =>
    prisma.refreshToken.create({ data }),

  findRefreshTokenByHash: (tokenHash: string) =>
    prisma.refreshToken.findUnique({ where: { tokenHash } }),

  revokeToken: (id: string) =>
    prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } }),

  revokeFamily: (familyId: string) =>
    prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
};
