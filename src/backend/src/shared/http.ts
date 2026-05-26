import { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { AppError } from "./errors.js";

export type JsonObject = Record<string, unknown>;

export async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8").trim();

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new AppError(400, "INVALID_JSON", "Request body must be valid JSON");
  }
}

export function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
}

export function sendHtml(response: ServerResponse, status: number, body: string) {
  response.writeHead(status, {
    "content-type": "text/html; charset=utf-8"
  });
  response.end(body);
}

export function sendError(response: ServerResponse, error: unknown) {
  if (error instanceof AppError) {
    sendJson(response, error.status, {
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof ZodError) {
    sendJson(response, 400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        issues: error.issues
      }
    });
    return;
  }

  console.error(error);
  sendJson(response, 500, {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error"
    }
  });
}
