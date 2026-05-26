import { createServer } from "node:http";
import { db } from "./server/db.js";
import { login, requireRole, requireUser, sanitizeUser } from "./server/auth.js";
import { Router } from "./shared/router.js";
import { readJson, sendHtml, sendJson } from "./shared/http.js";
import { openApiSpec } from "./docs/openapi.js";
import { swaggerUiHtml } from "./docs/swagger-ui.js";
import { TaskRepository } from "./features/tasks/task.repository.js";
import { TaskService } from "./features/tasks/task.service.js";
import {
  createTaskSchema,
  loginSchema,
  reviewTaskSchema,
  submitTaskSchema,
  updateTaskSchema
} from "./features/tasks/task.schemas.js";

const router = new Router();
const taskRepository = new TaskRepository(db);
const taskService = new TaskService(taskRepository);

router.add("GET", "/health", ({ response }) => {
  sendJson(response, 200, {
    status: "ok",
    service: "zhizhi-backend"
  });
});

router.add("GET", "/openapi.json", ({ response }) => {
  sendJson(response, 200, openApiSpec);
});

router.add("GET", "/docs", ({ response }) => {
  sendHtml(response, 200, swaggerUiHtml());
});

router.add("POST", "/auth/login", async ({ request, response }) => {
  const body = loginSchema.parse(await readJson(request));
  sendJson(response, 200, login(body.username, body.password));
});

router.add("GET", "/auth/me", ({ request, response }) => {
  const user = requireUser(request.headers.authorization);
  sendJson(response, 200, {
    user: sanitizeUser(user)
  });
});

router.add("GET", "/parent/dashboard", ({ request, response }) => {
  const parent = requireRole(request.headers.authorization, "parent");
  sendJson(response, 200, taskService.getParentDashboard(parent));
});

router.add("GET", "/tasks/today", ({ request, response }) => {
  const user = requireUser(request.headers.authorization);
  sendJson(response, 200, {
    tasks: taskService.listTodayTasks(user)
  });
});

router.add("POST", "/tasks", async ({ request, response }) => {
  const parent = requireRole(request.headers.authorization, "parent");
  const body = createTaskSchema.parse(await readJson(request));
  sendJson(response, 201, {
    task: taskService.createTask(parent, body)
  });
});

router.add("GET", "/tasks/:taskId", ({ request, response, params }) => {
  const user = requireUser(request.headers.authorization);
  sendJson(response, 200, {
    task: taskService.getTask(user, params.taskId)
  });
});

router.add("PATCH", "/tasks/:taskId", async ({ request, response, params }) => {
  const parent = requireRole(request.headers.authorization, "parent");
  const body = updateTaskSchema.parse(await readJson(request));
  sendJson(response, 200, {
    task: taskService.updateTask(parent, params.taskId, body)
  });
});

router.add("DELETE", "/tasks/:taskId", ({ request, response, params }) => {
  const parent = requireRole(request.headers.authorization, "parent");
  taskService.deleteTask(parent, params.taskId);
  sendJson(response, 204, null);
});

router.add("POST", "/tasks/:taskId/submissions", async ({ request, response, params }) => {
  const child = requireRole(request.headers.authorization, "child");
  const body = submitTaskSchema.parse(await readJson(request));
  sendJson(response, 201, taskService.submitTask(child, params.taskId, body));
});

router.add("POST", "/tasks/:taskId/reviews", async ({ request, response, params }) => {
  const parent = requireRole(request.headers.authorization, "parent");
  const body = reviewTaskSchema.parse(await readJson(request));
  sendJson(response, 201, taskService.reviewTask(parent, params.taskId, body));
});

export function createApp() {
  return createServer((request, response) => {
    void router.handle(request, response);
  });
}
