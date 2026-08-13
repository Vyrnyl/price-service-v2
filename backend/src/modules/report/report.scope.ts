import type { AuthUser } from '../../shared/types/express';

export function resolveReportScope(authUser?: AuthUser) {
  if (!authUser) {
    return undefined;
  }

  if (authUser.role === 'OFFICER') {
    return { generatedBy: authUser.userId };
  }

  return undefined;
}
