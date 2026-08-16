import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies, setAuthCookies, tryRefreshTokens } from "@/shared/utils/token-refresh";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export const dynamic = "force-dynamic";

function buildTargetUrl(request: NextRequest) {
  const targetPath = request.nextUrl.pathname.replace(/^\/api\//, "/api/v1/");
  const targetUrl = new URL(`${API_BASE_URL}${targetPath}`);

  const searchParams = request.nextUrl.searchParams.toString();
  if (searchParams) {
    targetUrl.search = searchParams;
  }

  return targetUrl;
}

async function forward(
  request: NextRequest,
  targetUrl: URL,
  accessToken: string | undefined,
  body: ArrayBuffer | undefined,
) {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    headers.delete("authorization");
  }

  return fetch(targetUrl, {
    method: request.method,
    headers,
    body,
  });
}

function toNextResponse(response: Response) {
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("content-encoding");

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

async function proxyRequest(request: NextRequest) {
  const targetUrl = buildTargetUrl(request);
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : await request.arrayBuffer();

  const response = await forward(request, targetUrl, accessToken, body);

  if (response.status !== 401 || !refreshToken) {
    return toNextResponse(response);
  }

  // The access token expired or was rejected — exchange the refresh token
  // once and retry transparently, so the caller never sees the 401 as long
  // as the session itself is still valid. No client call site needs to know.
  const rotated = await tryRefreshTokens(refreshToken);

  if (!rotated) {
    // The refresh token itself is dead (expired, reused, or revoked) — clear
    // both cookies so the client stops silently retrying a refresh that can
    // never succeed; the next navigation's middleware check sends the user
    // back to login.
    const deadSessionResponse = toNextResponse(response);
    clearAuthCookies(deadSessionResponse);
    return deadSessionResponse;
  }

  const retryResponse = await forward(request, targetUrl, rotated.accessToken, body);
  const nextResponse = toNextResponse(retryResponse);
  setAuthCookies(nextResponse, rotated);
  return nextResponse;
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}
