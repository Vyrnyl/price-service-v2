export interface ApiRequestOptions {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
  credentials?: RequestCredentials;
}

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function resolveUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/api/")) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", headers = {}, body, credentials = "include" } = options;
  const url = resolveUrl(path);

  const fetchOptions: RequestInit = {
    method,
    credentials,
    headers: { ...headers },
  };

  if (body !== undefined) {
    fetchOptions.headers = {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    };
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  const text = await response.text();

  let data: unknown;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? (data as any).message
        : response.statusText || "API request failed";
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

interface PaginatedApiResponse<T> {
  status: string;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Reference-data lists (commodities, stores, ...) are capped at the backend's
 * MAX_PAGE_SIZE per request (a deliberate DoS-prevention ceiling — see
 * pagination.schema.ts). Once a table's row count exceeds that ceiling, a
 * single page silently stops being "effectively everything". This walks
 * every page so dropdown/filter data sources stay complete regardless of
 * how large the underlying table grows.
 */
export async function fetchAllPages<T>(
  basePath: string,
  options: ApiRequestOptions = {},
  pageSize = 100,
): Promise<T[]> {
  const separator = basePath.includes("?") ? "&" : "?";
  const results: T[] = [];
  let page = 1;

  while (true) {
    const response = await apiFetch<PaginatedApiResponse<T>>(
      `${basePath}${separator}page=${page}&pageSize=${pageSize}`,
      options,
    );
    results.push(...response.data);

    if (results.length >= response.total || response.data.length === 0) {
      break;
    }
    page += 1;
  }

  return results;
}
