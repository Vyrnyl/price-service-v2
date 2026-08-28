import { NextResponse, type NextRequest } from "next/server";
import { clearAuthCookies, setAuthCookies, tryRefreshTokens } from "@/shared/utils/token-refresh";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export const dynamic = "force-dynamic";

async function fetchMe(token: string) {
  return fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    let response = await fetchMe(token);

    if (response.status === 401 && refreshToken) {
      const rotated = await tryRefreshTokens(refreshToken);

      if (!rotated) {
        const deadSessionResponse = NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 },
        );
        clearAuthCookies(deadSessionResponse);
        return deadSessionResponse;
      }

      response = await fetchMe(rotated.accessToken);
      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { success: false, message: data?.message ?? "Unable to fetch user" },
          { status: response.status },
        );
      }

      const nextResponse = NextResponse.json({
        success: true,
        data: data?.data ?? null,
        message: data?.message ?? "Authenticated user fetched",
      });
      setAuthCookies(nextResponse, rotated);
      return nextResponse;
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message ?? "Unable to fetch user",
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.data ?? null,
      message: data?.message ?? "Authenticated user fetched",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch user",
      },
      { status: 500 },
    );
  }
}
