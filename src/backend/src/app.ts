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
import { FamilyRepository } from "./features/family/family.repository.js";
import { FamilyService } from "./features/family/family.service.js";
import { ProductMetricsRepository } from "./features/metrics/product-metrics.repository.js";
import { ProductMetricsService } from "./features/metrics/product-metrics.service.js";
import { mvpMetricsQuerySchema } from "./features/metrics/product-metrics.schemas.js";
import {
  calendarTaskQuerySchema,
  createTaskSchema,
  historyTaskQuerySchema,
  loginSchema,
  reviewTaskSchema,
  submitTaskSchema,
  updateTaskSchema
} from "./features/tasks/task.schemas.js";
import {
  approveWishSchema,
  createWishSchema,
  rejectRedeemSchema,
  rejectWishSchema,
  updateWishSchema
} from "./features/incentives/incentive.schemas.js";

const router = new Router();
const taskRepository = new TaskRepository(pool);
const incentiveRepository = new IncentiveRepository(pool);
const incentiveService = new IncentiveService(incentiveRepository);
const taskService = new TaskService(taskRepository, incentiveService);
const familyService = new FamilyService(new FamilyRepository(pool));
const productMetricsService = new ProductMetricsService(new ProductMetricsRepository(pool));

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

router.add("GET", "/uploads/photos/:fileName", async ({ request, response, params }) => {
  const user = await requireUser(request.headers.authorization);
  await taskService.assertPhotoAccess(user, params.fileName);
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

router.add("GET", "/family/context", async ({ request, response }) => {
  const user = await requireUser(request.headers.authorization);
  sendJson(response, 200, await familyService.getContext(user));
});

router.add("POST", "/uploads/photos", async ({ request, response }) => {
  await requireRole(request.headers.authorization, "child");
  sendJson(response, 201, await saveUploadedFile(request));
});

router.add("GET", "/parent/dashboard", async ({ request, response }) => {
  const parent = await requireRole(request.headers.authorization, "parent");
  const context = await familyService.getContext(parent);
  const [dashboard, points, metrics] = await Promise.all([
    taskService.getParentDashboard(parent),
    incentiveService.getPointAccount(parent, context.child.id),
    productMetricsService.getMvpSummary(parent, context.child.id, 14)
  ]);
  sendJson(response, 200, {
    ...dashboard,
    child: context.child,
    pointAccount: points.account,
    metrics
  });
});

router.add("GET", "/metrics/mvp", async ({ request, response, query }) => {
  const parent = await requireRole(request.headers.authorization, "parent");
  const context = await familyService.getContext(parent);
  const parsedQuery = mvpMetricsQuerySchema.parse({
    days: query.get("days") ?? undefined
  });
  sendJson(
    response,
    200,
    await productMetricsService.getMvpSummary(parent, context.child.id, parsedQuery.days)
  );
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
  const wish = await incentiveService.createWish(child, body);
  await productMetricsService.record(child, {
    eventName: "wish_created",
    childUserId: child.id,
    entityType: "wish",
    entityId: wish.id
  });
  sendJson(response, 201, {
    wish
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
  const wish = await incentiveService.approveWish(parent, params.wishId, body);
  await productMetricsService.record(parent, {
    eventName: "wish_approved",
    childUserId: wish.childUserId,
    entityType: "wish",
    entityId: wish.id,
    metadata: { requiredPoints: wish.requiredPoints }
  });
  sendJson(response, 200, {
    wish
  });
});

router.add("PATCH", "/wishes/:wishId/reject", async ({ request, response, params }) => {
  const parent = await requireRole(request.headers.authorization, "parent");
  const body = rejectWishSchema.parse(await readJson(request));
  const wish = await incentiveService.rejectWish(parent, params.wishId, body);
  await productMetricsService.record(parent, {
    eventName: "wish_rejected",
    childUserId: wish.childUserId,
    entityType: "wish",
    entityId: wish.id
  });
  sendJson(response, 200, {
    wish
  });
});

router.add("POST", "/wishes/:wishId/redeem-requests", async ({ request, response, params }) => {
  const child = await requireRole(request.headers.authorization, "child");
  const result = await incentiveService.requestRedeem(child, params.wishId);
  await productMetricsService.record(child, {
    eventName: "wish_redeem_requested",
    childUserId: child.id,
    entityType: "wish",
    entityId: result.wish.id,
    metadata: { requestId: result.wish.currentRedeemRequestId }
  });
  sendJson(response, 200, result);
});

router.add("POST", "/wishes/:wishId/redeem-confirmations", async ({ request, response, params }) => {
  const parent = await requireRole(request.headers.authorization, "parent");
  const wish = await incentiveService.confirmRedeem(parent, params.wishId);
  await productMetricsService.record(parent, {
    eventName: "wish_redeem_confirmed",
    childUserId: wish.childUserId,
    entityType: "wish",
    entityId: wish.id
  });
  sendJson(response, 200, {
    wish
  });
});

router.add("POST", "/wishes/:wishId/redeem-rejections", async ({ request, response, params }) => {
  const parent = await requireRole(request.headers.authorization, "parent");
  const body = rejectRedeemSchema.parse(await readJson(request));
  const result = await incentiveService.rejectRedeem(parent, params.wishId, body.rejectReason);
  await productMetricsService.record(parent, {
    eventName: "wish_redeem_rejected",
    childUserId: result.wish.childUserId,
    entityType: "wish",
    entityId: result.wish.id,
    metadata: { refundAmount: result.ledger?.changeAmount ?? 0 }
  });
  sendJson(response, 200, result);
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

router.add("GET", "/tasks/history", async ({ request, response, query }) => {
  const user = await requireUser(request.headers.authorization);
  const parsedQuery = historyTaskQuerySchema.parse({
    childUserId: query.get("childUserId") ?? undefined,
    startDate: query.get("startDate") ?? undefined,
    endDate: query.get("endDate") ?? undefined
  });
  sendJson(response, 200, {
    tasks: await taskService.listHistoryTasks(user, parsedQuery)
  });
});

router.add("POST", "/tasks", async ({ request, response }) => {
  const parent = await requireRole(request.headers.authorization, "parent");
  const body = createTaskSchema.parse(await readJson(request));
  const task = await taskService.createTask(parent, body);
  await productMetricsService.record(parent, {
    eventName: "task_created",
    childUserId: task.childUserId,
    entityType: "task",
    entityId: task.id
  });
  sendJson(response, 201, {
    task
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
  const result = await taskService.submitTask(child, params.taskId, body);
  await productMetricsService.record(child, {
    eventName: "task_submitted",
    childUserId: child.id,
    entityType: "task",
    entityId: params.taskId,
    metadata: { submissionId: result.submission.id }
  });
  sendJson(response, 201, result);
});

router.add("POST", "/tasks/:taskId/reviews", async ({ request, response, params }) => {
  const parent = await requireRole(request.headers.authorization, "parent");
  const body = reviewTaskSchema.parse(await readJson(request));
  const result = await taskService.reviewTask(parent, params.taskId, body);
  if (!result.idempotent) {
    await productMetricsService.record(parent, {
      eventName: body.reviewResult === "pass" ? "task_confirmed" : "task_resubmit_requested",
      childUserId: result.task.childUserId,
      entityType: "task",
      entityId: params.taskId,
      metadata: { submissionId: result.submission.id }
    });
  }
  sendJson(response, result.idempotent ? 200 : 201, result);
});

export function createApp() {
  return createServer((request, response) => {
    void router.handle(request, response);
  });
}
