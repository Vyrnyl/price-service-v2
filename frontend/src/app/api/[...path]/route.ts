import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export const dynamic = "force-dynamic";

async function proxyRequest(request: NextRequest) {
  const targetPath = request.nextUrl.pathname.replace(/^\/api\//, "/api/v1/");
  const targetUrl = new URL(`${API_BASE_URL}${targetPath}`);

  const searchParams = request.nextUrl.searchParams.toString();
  if (searchParams) {
    targetUrl.search = searchParams;
  }

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const token = request.cookies.get("accessToken")?.value;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : await request.arrayBuffer();

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("content-encoding");

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
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
