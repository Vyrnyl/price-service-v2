import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "./shared/utils/jwt";
import { setAuthCookies, tryRefreshTokens, type RotatedTokens } from "./shared/utils/token-refresh";

const PROTECTED_PREFIXES = ["/admin", "/officer"];

function isProtectedRoute(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function normalizeJwtRole(role: string | null) {
  if (role === "ADMIN") return "admin";
  if (role === "OFFICER") return "officer";
  return null;
}

function getDashboardPath(role: string | null) {
  if (role === "admin") return "/admin";
  if (role === "officer") return "/officer";
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  let rotated: RotatedTokens | null = null;

  let payload: Awaited<ReturnType<typeof verifyToken>> | null = null;
  if (accessToken) {
    try {
      payload = await verifyToken(accessToken);
    } catch {
      payload = null;
    }
  }

  // The access token is missing or expired — try the refresh token before
  // bouncing the user to login, so a session survives navigation past the
  // 1-hour access-token window as long as the refresh token is still valid.
  if (!payload && refreshToken) {
    rotated = await tryRefreshTokens(refreshToken);
    if (rotated) {
      accessToken = rotated.accessToken;
      try {
        payload = await verifyToken(accessToken);
      } catch {
        payload = null;
      }
    }
  }

  const attach = (response: NextResponse) => {
    if (rotated) {
      setAuthCookies(response, rotated);
    }
    return response;
  };

  if (!payload) {
    if (!isProtectedRoute(pathname)) {
      return attach(NextResponse.next());
    }
    return attach(NextResponse.redirect(new URL("/", request.url)));
  }

  const role = normalizeJwtRole(typeof payload.role === "string" ? payload.role : null);
  const dashboardPath = getDashboardPath(role);

  if (isProtectedRoute(pathname)) {
    if (pathname.startsWith("/admin") && role !== "admin") {
      return attach(NextResponse.redirect(new URL("/", request.url)));
    }
    if (pathname.startsWith("/officer") && role !== "officer") {
      return attach(NextResponse.redirect(new URL("/", request.url)));
    }
    return attach(NextResponse.next());
  }

  if (dashboardPath) {
    return attach(NextResponse.redirect(new URL(dashboardPath, request.url)));
  }

  return attach(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico).*)"],
};
