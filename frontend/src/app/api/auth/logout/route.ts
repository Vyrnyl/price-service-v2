import { NextResponse, type NextRequest } from "next/server";
import { clearAuthCookies } from "@/shared/utils/token-refresh";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Best-effort server-side revocation — the cookies are cleared below
      // regardless, so the user is logged out locally even if this fails.
    }
  }

  const response = NextResponse.json({
    success: true,
    message: "Logout successful",
  });

  clearAuthCookies(response);

  return response;
}
