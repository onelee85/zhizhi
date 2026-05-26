import { IncomingMessage, ServerResponse } from "node:http";
import { AppError } from "./errors.js";
import { sendError } from "./http.js";

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

          await route.handler({
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
}
