import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/shared/utils/jwt";
import { clearAuthCookies, setAuthCookies, tryRefreshTokens } from "@/shared/utils/token-refresh";

export const dynamic = "force-dynamic";

function normalizeJwtRole(role: string | null) {
  if (role === "ADMIN") return "admin";
  if (role === "OFFICER") return "officer";
  return null;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (!token) {
    return NextResponse.json({ role: null });
  }

  try {
    const payload = await verifyToken(token);
    const role = normalizeJwtRole(typeof payload.role === "string" ? payload.role : null);
    return NextResponse.json({ role });
  } catch {
    if (!refreshToken) {
      return NextResponse.json({ role: null });
    }

    const rotated = await tryRefreshTokens(refreshToken);

    if (!rotated) {
      const deadSessionResponse = NextResponse.json({ role: null });
      clearAuthCookies(deadSessionResponse);
      return deadSessionResponse;
    }

    try {
      const payload = await verifyToken(rotated.accessToken);
      const role = normalizeJwtRole(typeof payload.role === "string" ? payload.role : null);
      const response = NextResponse.json({ role });
      setAuthCookies(response, rotated);
      return response;
    } catch {
      return NextResponse.json({ role: null });
    }
  }
}
