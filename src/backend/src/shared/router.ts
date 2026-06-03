import { IncomingMessage, ServerResponse } from "node:http";
import { AppError } from "./errors.js";
import { sendError } from "./http.js";
import { isTransientConnectionError, waitForRetry } from "./retry.js";

export type RequestContext = {
  request: IncomingMessage;
  response: ServerResponse;
  params: Record<string, string>;
  query: URLSearchParams;
};

type Handler = (context: RequestContext) => Promise<void> | void;

type Route = {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: Handler;
};

export class Router {
  private readonly routes: Route[] = [];

  add(method: string, path: string, handler: Handler) {
    const paramNames: string[] = [];
    const pattern = new RegExp(
      `^${path
        .split("/")
        .map((part) => {
          if (part.startsWith(":")) {
            paramNames.push(part.slice(1));
            return "([^/]+)";
          }

          return part;
        })
        .join("/")}$`
    );

    this.routes.push({ method, pattern, paramNames, handler });
  }

  async handle(request: IncomingMessage, response: ServerResponse) {
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      const method = request.method ?? "GET";

      for (const route of this.routes) {
        const match = url.pathname.match(route.pattern);

        if (route.method === method && match) {
          const params = Object.fromEntries(
            route.paramNames.map((name, index) => [name, decodeURIComponent(match[index + 1] ?? "")])
          );

          await this.handleRoute(route, method, {
            request,
            response,
            params,
            query: url.searchParams
          });
          return;
        }
      }

      throw new AppError(404, "ROUTE_NOT_FOUND", "Route not found");
    } catch (error) {
      sendError(response, error);
    }
  }

  private async handleRoute(route: Route, method: string, context: RequestContext) {
    const maxAttempts = ["GET", "HEAD"].includes(method) ? 3 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        await route.handler(context);
        return;
      } catch (error) {
        if (attempt < maxAttempts - 1 && isTransientConnectionError(error)) {
          await waitForRetry(attempt);
          continue;
        }

        if (isTransientConnectionError(error)) {
          throw new AppError(503, "TEMPORARY_CONNECTION_ERROR", "Temporary connection issue, please try again");
        }

        throw error;
      }
    }
  }
}
