import type { AuthUser } from '../../shared/types/express';

export type StoreScope = { userId?: string } | null;

export function resolveStoreScope(authUser?: AuthUser): StoreScope {
  if (authUser?.role === 'OFFICER') {
    return { userId: authUser.userId };
  }

  if (authUser?.role === 'ADMIN') {
    return {};
  }

  return null;
}
