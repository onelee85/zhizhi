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
import { IncentiveRepository } from "./features/incentives/incentive.repository.js";
import { IncentiveService } from "./features/incentives/incentive.service.js";
import {
  calendarTaskQuerySchema,
  createTaskSchema,
  loginSchema,
  reviewTaskSchema,
  submitTaskSchema,
  updateTaskSchema
} from "./features/tasks/task.schemas.js";
import {
  approveWishSchema,
  createWishSchema,
  rejectWishSchema,
  updateWishSchema
} from "./features/incentives/incentive.schemas.js";

const router = new Router();
const taskRepository = new TaskRepository(pool);
const incentiveRepository = new IncentiveRepository(pool);
const incentiveService = new IncentiveService(incentiveRepository);
const taskService = new TaskService(taskRepository, incentiveService);

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

router.add("GET", "/points/account", async ({ request, response, query }) => {
  const user = await requireUser(request.headers.authorization);
  sendJson(response, 200, await incentiveService.getPointAccount(user, query.get("childUserId") ?? undefined));
});

router.add("GET", "/wishes", async ({ request, response, query }) => {
  const user = await requireUser(request.headers.authorization);
  sendJson(response, 200, {
    wishes: await incentiveService.listWishes(user, query.get("childUserId") ?? undefined)
  });
});

router.add("POST", "/wishes", async ({ request, response }) => {
  const child = await requireRole(request.headers.authorization, "child");
  const body = createWishSchema.parse(await readJson(request));
  sendJson(response, 201, {
    wish: await incentiveService.createWish(child, body)
  });
});

router.add("GET", "/wishes/:wishId", async ({ request, response, params }) => {
  const user = await requireUser(request.headers.authorization);
  sendJson(response, 200, {
    wish: await incentiveService.getWish(user, params.wishId)
  });
});

router.add("PATCH", "/wishes/:wishId", async ({ request, response, params }) => {
  const child = await requireRole(request.headers.authorization, "child");
  const body = updateWishSchema.parse(await readJson(request));
  sendJson(response, 200, {
    wish: await incentiveService.updateWish(child, params.wishId, body)
  });
});

router.add("DELETE", "/wishes/:wishId", async ({ request, response, params }) => {
  const user = await requireUser(request.headers.authorization);
  await incentiveService.deleteWish(user, params.wishId);
  sendJson(response, 204, null);
});

router.add("PATCH", "/wishes/:wishId/approve", async ({ request, response, params }) => {
  const parent = await requireRole(request.headers.authorization, "parent");
  const body = approveWishSchema.parse(await readJson(request));
  sendJson(response, 200, {
    wish: await incentiveService.approveWish(parent, params.wishId, body)
  });
});

router.add("PATCH", "/wishes/:wishId/reject", async ({ request, response, params }) => {
  const parent = await requireRole(request.headers.authorization, "parent");
  const body = rejectWishSchema.parse(await readJson(request));
  sendJson(response, 200, {
    wish: await incentiveService.rejectWish(parent, params.wishId, body)
  });
});

router.add("POST", "/wishes/:wishId/redeem-requests", async ({ request, response, params }) => {
  const child = await requireRole(request.headers.authorization, "child");
  sendJson(response, 200, {
    wish: await incentiveService.requestRedeem(child, params.wishId)
  });
});

router.add("POST", "/wishes/:wishId/redeem-confirmations", async ({ request, response, params }) => {
  const parent = await requireRole(request.headers.authorization, "parent");
  sendJson(response, 200, await incentiveService.confirmRedeem(parent, params.wishId));
});

router.add("GET", "/tasks/today", async ({ request, response, query }) => {
  const user = await requireUser(request.headers.authorization);
  const includeOverdueIncomplete = query.get("includeOverdueIncomplete") === "true";
  const includeCompleted = query.get("includeCompleted") === "true";
  sendJson(response, 200, {
    tasks: await taskService.listTodayTasks(user, { includeOverdueIncomplete, includeCompleted })
  });
});

router.add("GET", "/tasks/calendar", async ({ request, response, query }) => {
  const user = await requireUser(request.headers.authorization);
  const parsedQuery = calendarTaskQuerySchema.parse({
    month: query.get("month")
  });
  sendJson(response, 200, {
    tasks: await taskService.listCalendarTasks(user, parsedQuery)
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
