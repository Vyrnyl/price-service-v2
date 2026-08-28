import type { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export const ACCESS_TOKEN_COOKIE_MAX_AGE = 60 * 60;
export const REFRESH_TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export interface RotatedTokens {
  accessToken: string;
  refreshToken: string;
}

// Exchanges a refresh token for a new access/refresh pair. Used by both the
// API proxy (retry a 401'd request transparently) and the page middleware
// (avoid bouncing a user to login on navigation when only the access token,
// not the session, has expired).
export async function tryRefreshTokens(refreshToken: string): Promise<RotatedTokens | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const accessToken = data?.data?.accessToken;
    const rotatedRefreshToken = data?.data?.refreshToken;

    if (typeof accessToken !== "string" || typeof rotatedRefreshToken !== "string") {
      return null;
    }

    return { accessToken, refreshToken: rotatedRefreshToken };
  } catch {
    return null;
  }
}

export function setAuthCookies(response: NextResponse, tokens: RotatedTokens) {
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set({
    name: "accessToken",
    value: tokens.accessToken,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
  });

  response.cookies.set({
    name: "refreshToken",
    value: tokens.refreshToken,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
  });
}

export function clearAuthCookies(response: NextResponse) {
  const secure = process.env.NODE_ENV === "production";

  for (const name of ["accessToken", "refreshToken"]) {
    response.cookies.set({ name, value: "", httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  }
}
