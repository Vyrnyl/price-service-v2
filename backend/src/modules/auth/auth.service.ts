import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import AppError from '../../shared/utils/AppError';
import { userRepository } from '../user';
import { auditLogService } from '../audit-log';
import type { LoginInput } from './auth.schema';
import { env } from '../../config/env';
import { authRepository } from './auth.repository';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SafeUser = { id: string; name: string; email: string; role: 'ADMIN' | 'OFFICER'; isActive: boolean };

function hashToken(rawToken: string) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function signAccessToken(user: Pick<SafeUser, 'id' | 'email' | 'role'>) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );
}

async function issueRefreshToken(userId: string, familyId: string) {
  const rawToken = crypto.randomBytes(48).toString('hex');

  await authRepository.createRefreshToken({
    userId,
    familyId,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return rawToken;
}

function toSafeUser(user: { id: string; name: string; email: string; role: 'ADMIN' | 'OFFICER'; isActive: boolean }): SafeUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
}

export const authService = {
  login: async (input: LoginInput) => {
    const user = await userRepository.findByEmail(input.email);

    if (!user || !user.password) {
      throw new AppError('Invalid email or password', 401);
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password);
    if (!passwordMatches) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is inactive', 403);
    }

    if (user.role !== 'ADMIN' && user.role !== 'OFFICER') {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = signAccessToken(user);
    const familyId = crypto.randomUUID();
    const refreshToken = await issueRefreshToken(user.id, familyId);

    await auditLogService.record({ actorId: user.id, action: 'LOGIN' });
    await userRepository.update(user.id, { lastLoginAt: new Date() });

    return {
      user: toSafeUser(user),
      accessToken,
      refreshToken,
    };
  },

  // Rotation with reuse detection: each refresh token is single-use. Presenting
  // an already-rotated-away (revoked) token means the chain may be compromised
  // (a stolen token replayed after the legitimate client already rotated past
  // it) — the whole family is revoked so both the attacker and the legitimate
  // client are forced back to a real login, rather than trusting either.
  refresh: async (rawToken: string) => {
    const tokenHash = hashToken(rawToken);
    const existing = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!existing) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (existing.revokedAt) {
      await authRepository.revokeFamily(existing.familyId);
      throw new AppError('Invalid refresh token', 401);
    }

    if (existing.expiresAt.getTime() < Date.now()) {
      throw new AppError('Refresh token expired', 401);
    }

    const user = await userRepository.findById(existing.userId);
    if (!user || !user.isActive) {
      throw new AppError('Invalid refresh token', 401);
    }

    await authRepository.revokeToken(existing.id);
    const refreshToken = await issueRefreshToken(user.id, existing.familyId);
    const accessToken = signAccessToken(user);

    return {
      user: toSafeUser(user),
      accessToken,
      refreshToken,
    };
  },

  logout: async (rawToken?: string) => {
    if (!rawToken) {
      return;
    }

    const existing = await authRepository.findRefreshTokenByHash(hashToken(rawToken));
    if (existing) {
      await authRepository.revokeFamily(existing.familyId);
    }
  },
};
