import { NextRequest, NextResponse } from "next/server";

const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const RETRYABLE_STATUS_CODES = new Set([408, 502, 503, 504]);

function shouldRetry(method: string, response: Response) {
  return ["GET", "HEAD"].includes(method) && RETRYABLE_STATUS_CODES.has(response.status);
}

async function waitForRetry(attempt: number) {
  const delayMs = Math.min(150 * 2 ** attempt, 600);
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = new URL(path.join("/"), backendBaseUrl);
  target.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");

  const method = request.method.toUpperCase();
  const body = ["GET", "HEAD"].includes(method) ? undefined : await request.arrayBuffer();
  const maxAttempts = ["GET", "HEAD"].includes(method) ? 3 : 1;
  let response: Response | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      response = await fetch(target, {
        method,
        headers,
        body,
        cache: "no-store"
      });

      if (attempt < maxAttempts - 1 && shouldRetry(method, response)) {
        await waitForRetry(attempt);
        continue;
      }

      break;
    } catch {
      if (attempt < maxAttempts - 1) {
        await waitForRetry(attempt);
        continue;
      }

      return NextResponse.json(
        {
          error: {
            code: "BACKEND_UNAVAILABLE",
            message: "后端服务暂时不可用，请稍后重试"
          }
        },
        { status: 503 }
      );
    }
  }

  if (!response) {
    return NextResponse.json(
      {
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: "后端服务暂时不可用，请稍后重试"
        }
      },
      { status: 503 }
    );
  }

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
