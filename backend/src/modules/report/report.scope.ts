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

/**
 * Which price records may appear *inside* a generated report.
 *
 * Deliberately mirrors `resolvePriceRecordScope` rather than importing it — an
 * officer must not export data they cannot read at `/officer/price-records`.
 * The two rules are the same rule and must stay in step; kept local because no
 * backend module imports another module's internals.
 */
export function resolveReportRecordScope(authUser?: AuthUser) {
  if (!authUser) {
    return undefined;
  }

  if (authUser.role === 'OFFICER') {
    return { userId: authUser.userId };
  }

  return undefined;
}
