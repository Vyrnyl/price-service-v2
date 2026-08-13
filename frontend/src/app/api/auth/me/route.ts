import { NextResponse, type NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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
