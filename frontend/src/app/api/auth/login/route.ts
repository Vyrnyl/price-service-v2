import { NextResponse, type NextRequest } from "next/server";
import { setAuthCookies } from "@/shared/utils/token-refresh";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message ?? "Login failed",
        },
        { status: response.status },
      );
    }

    const accessToken = data?.data?.accessToken;
    const refreshToken = data?.data?.refreshToken;
    const user = data?.data?.user;

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          message: "No access token returned from backend",
        },
        { status: 500 },
      );
    }

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "No refresh token returned from backend",
        },
        { status: 500 },
      );
    }

    const nextResponse = NextResponse.json({
      success: true,
      data: user,
      message: "Login successful",
    });

    setAuthCookies(nextResponse, { accessToken, refreshToken });

    return nextResponse;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to sign in. Please try again.",
      },
      { status: 500 },
    );
  }
}
