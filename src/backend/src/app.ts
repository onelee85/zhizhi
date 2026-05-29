import { createServer } from "node:http";
import { pool } from "./server/db.js";
import { login, requireRole, requireUser, sanitizeUser } from "./server/auth.js";
import { Router } from "./shared/router.js";
import { readJson, sendHtml, sendJson } from "./shared/http.js";
import { openApiSpec } from "./docs/openapi.js";
import { swaggerUiHtml } from "./docs/swagger-ui.js";
import { saveUploadedFile, sendLocalUploadedFile } from "./server/uploads.js";
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
const taskRepository = new TaskRepository(pool);
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

router.add("GET", "/uploads/photos/:fileName", async ({ response, params }) => {
  await sendLocalUploadedFile(response, params.fileName);
});

router.add("POST", "/auth/login", async ({ request, response }) => {
  const body = loginSchema.parse(await readJson(request));
  sendJson(response, 200, await login(body.username, body.password));
});

router.add("GET", "/auth/me", async ({ request, response }) => {
  const user = await requireUser(request.headers.authorization);
  sendJson(response, 200, {
    user: sanitizeUser(user)
  });
});

router.add("POST", "/uploads/photos", async ({ request, response }) => {
  await requireRole(request.headers.authorization, "child");
  sendJson(response, 201, await saveUploadedFile(request));
});

router.add("GET", "/parent/dashboard", async ({ request, response }) => {
  const parent = await requireRole(request.headers.authorization, "parent");
  sendJson(response, 200, await taskService.getParentDashboard(parent));
});

router.add("GET", "/tasks/today", async ({ request, response, query }) => {
  const user = await requireUser(request.headers.authorization);
  const includeOverdueIncomplete = query.get("includeOverdueIncomplete") === "true";
  const includeCompleted = query.get("includeCompleted") === "true";
  sendJson(response, 200, {
    tasks: await taskService.listTodayTasks(user, { includeOverdueIncomplete, includeCompleted })
  });
});

router.add("POST", "/tasks", async ({ request, response }) => {
  const parent = await requireRole(request.headers.authorization, "parent");
  const body = createTaskSchema.parse(await readJson(request));
  sendJson(response, 201, {
    task: await taskService.createTask(parent, body)
  });
});

router.add("GET", "/tasks/:taskId", async ({ request, response, params }) => {
  const user = await requireUser(request.headers.authorization);
  sendJson(response, 200, {
    task: await taskService.getTask(user, params.taskId)
  });
});

router.add("PATCH", "/tasks/:taskId", async ({ request, response, params }) => {
  const parent = await requireRole(request.headers.authorization, "parent");
  const body = updateTaskSchema.parse(await readJson(request));
  sendJson(response, 200, {
    task: await taskService.updateTask(parent, params.taskId, body)
  });
});

router.add("DELETE", "/tasks/:taskId", async ({ request, response, params }) => {
  const parent = await requireRole(request.headers.authorization, "parent");
  await taskService.deleteTask(parent, params.taskId);
  sendJson(response, 204, null);
});

router.add("POST", "/tasks/:taskId/submissions", async ({ request, response, params }) => {
  const child = await requireRole(request.headers.authorization, "child");
  const body = submitTaskSchema.parse(await readJson(request));
  sendJson(response, 201, await taskService.submitTask(child, params.taskId, body));
});

router.add("POST", "/tasks/:taskId/reviews", async ({ request, response, params }) => {
  const parent = await requireRole(request.headers.authorization, "parent");
  const body = reviewTaskSchema.parse(await readJson(request));
  sendJson(response, 201, await taskService.reviewTask(parent, params.taskId, body));
});

export function createApp() {
  return createServer((request, response) => {
    void router.handle(request, response);
  });
}
