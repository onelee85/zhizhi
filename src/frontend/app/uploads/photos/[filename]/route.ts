import { NextRequest, NextResponse } from "next/server";

const backendBaseUrl = process.env.BACKEND_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!/^\d+_[a-f0-9]{12}\.(jpg|jpeg|png|webp)$/.test(filename)) {
    return NextResponse.json(
      { error: { code: "INVALID_FILE_NAME", message: "Invalid file name" } },
      { status: 400 }
    );
  }

  const target = new URL(`/uploads/photos/${filename}`, backendBaseUrl);
  const response = await fetch(target, {
    headers: {
      authorization: request.headers.get("authorization") ?? ""
    },
    cache: "no-store"
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders
  });
}
