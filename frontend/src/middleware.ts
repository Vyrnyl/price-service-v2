import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "./shared/utils/jwt";

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
  const accessToken = request.cookies.get("accessToken")?.value;
  if (!accessToken) {
    if (!isProtectedRoute(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const payload = await verifyToken(accessToken);
    const role = normalizeJwtRole(
      typeof payload.role === "string" ? payload.role : null,
    );
    const dashboardPath = getDashboardPath(role);

    if (isProtectedRoute(pathname)) {
      if (pathname.startsWith("/admin") && role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
      if (pathname.startsWith("/officer") && role !== "officer") {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return NextResponse.next();
    }

    if (dashboardPath) {
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    return NextResponse.next();
  } catch {
    if (!isProtectedRoute(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico).*)"],
};
