import type { AuthUser } from '../../shared/types/express';

export function resolvePriceRecordScope(authUser?: AuthUser) {
  if (!authUser) {
    return undefined;
  }

  if (authUser.role === 'OFFICER') {
    return { userId: authUser.userId };
  }

  return undefined;
}
