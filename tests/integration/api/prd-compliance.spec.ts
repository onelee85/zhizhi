import { Buffer } from "node:buffer";
import { expect, test, type APIRequestContext } from "@playwright/test";

const apiPrefix = "";

test.describe.configure({ mode: "serial" });

test.describe("PRD route integration", () => {
  let parentToken = "";
  let childToken = "";

  test.beforeAll(async ({ request }) => {
    parentToken = await login(request, "parent_demo");
    childToken = await login(request, "child_demo");
  });

  test("returns the current single-child family context", async ({ request }) => {
    const response = await request.get(`${apiPrefix}/family/context`, {
      headers: auth(parentToken)
    });

    expect(response.status()).toBe(200);
    const body = await response.json() as {
      family: { id: string };
      child: { id: string; nickname: string };
    };
    expect(body.family.id).toBeTruthy();
    expect(body.child.id).toBeTruthy();
    expect(body.child.nickname).toBeTruthy();
  });

  test("defaults task points to one and rejects removed AI input", async ({ request }) => {
    const title = `API 默认积分 ${Date.now()}`;
    const response = await request.post(`${apiPrefix}/tasks`, {
      headers: auth(parentToken),
      data: {
        subject: "数学",
        taskType: "练习",
        title,
        description: "验证默认积分与唯一孩子解析。",
        note: "先复习例题",
        dueDate: businessDate(),
        needPhoto: false
      }
    });

    expect(response.status()).toBe(201);
    const body = await response.json() as {
      task: { childUserId: string; rewardPoints: number; note?: string };
    };
    expect(body.task.childUserId).toBeTruthy();
    expect(body.task.rewardPoints).toBe(1);
    expect(body.task.note).toBe("先复习例题");

    const removedInput = await request.post(`${apiPrefix}/tasks`, {
      headers: auth(parentToken),
      data: {
        subject: "数学",
        taskType: "练习",
        title: `${title} AI`,
        description: "公开接口不再接受 AI 选项。",
        dueDate: businessDate(),
        needAiCheck: true
      }
    });
    expect(removedInput.status()).toBe(400);
  });

  test("enforces roles and mandatory rejection reasons", async ({ request }) => {
    const forbidden = await request.post(`${apiPrefix}/tasks`, {
      headers: auth(childToken),
      data: {
        subject: "数学",
        taskType: "练习",
        title: "孩子不能创建",
        description: "角色校验",
        dueDate: businessDate()
      }
    });
    expect(forbidden.status()).toBe(403);

    const wishResponse = await request.post(`${apiPrefix}/wishes`, {
      headers: auth(childToken),
      data: {
        title: `API 驳回原因 ${Date.now()}`,
        description: "验证家长必须说明原因。"
      }
    });
    const wish = (await wishResponse.json() as { wish: { id: string } }).wish;
    const rejected = await request.patch(`${apiPrefix}/wishes/${wish.id}/reject`, {
      headers: auth(parentToken),
      data: { rejectReason: " " }
    });
    expect(rejected.status()).toBe(400);
  });

  test("requires a reason when asking for resubmission", async ({ request }) => {
    const taskId = await createTask(request, parentToken, false);
    const submitted = await request.post(`${apiPrefix}/tasks/${taskId}/submissions`, {
      headers: auth(childToken),
      data: { completed: true, imageUrls: [] }
    });
    expect(submitted.status()).toBe(201);

    const review = await request.post(`${apiPrefix}/tasks/${taskId}/reviews`, {
      headers: auth(parentToken),
      data: { reviewResult: "need_resubmit", comment: "" }
    });
    expect(review.status()).toBe(400);
  });

  test("keeps concurrent task confirmation idempotent", async ({ request }) => {
    const taskId = await createTask(request, parentToken, false, 3);
    const submitted = await request.post(`${apiPrefix}/tasks/${taskId}/submissions`, {
      headers: auth(childToken),
      data: { completed: true, imageUrls: [] }
    });
    expect(submitted.status()).toBe(201);

    const responses = await Promise.all([
      request.post(`${apiPrefix}/tasks/${taskId}/reviews`, {
        headers: auth(parentToken),
        data: { reviewResult: "pass", comment: "确认完成" }
      }),
      request.post(`${apiPrefix}/tasks/${taskId}/reviews`, {
        headers: auth(parentToken),
        data: { reviewResult: "pass", comment: "重复确认" }
      })
    ]);
    expect(responses.map((response) => response.status()).sort()).toEqual([200, 201]);

    const context = await request.get(`${apiPrefix}/family/context`, {
      headers: auth(parentToken)
    });
    const childUserId = (await context.json() as { child: { id: string } }).child.id;
    const points = await request.get(
      `${apiPrefix}/points/account?childUserId=${encodeURIComponent(childUserId)}`,
      { headers: auth(parentToken) }
    );
    const ledgers = (await points.json() as {
      ledger: Array<{ sourceId: string; reason: string }>;
    }).ledger;
    expect(ledgers.filter((ledger) => ledger.sourceId === taskId && ledger.reason === "task_reward")).toHaveLength(1);
  });

  test("protects linked submission images with authentication and ownership checks", async ({ request }) => {
    const taskId = await createTask(request, parentToken, true);
    const upload = await request.post(`${apiPrefix}/uploads/photos`, {
      headers: auth(childToken),
      multipart: {
        photo: {
          name: "integration-photo.png",
          mimeType: "image/png",
          buffer: pngFixture()
        }
      }
    });
    expect(upload.status()).toBe(201);
    const uploaded = await upload.json() as { url: string };

    const submitted = await request.post(`${apiPrefix}/tasks/${taskId}/submissions`, {
      headers: auth(childToken),
      data: { completed: true, imageUrls: [uploaded.url] }
    });
    expect(submitted.status()).toBe(201);

    const anonymousRead = await request.get(`${apiPrefix}${uploaded.url}`);
    expect(anonymousRead.status()).toBe(401);

    const childRead = await request.get(`${apiPrefix}${uploaded.url}`, {
      headers: auth(childToken)
    });
    expect(childRead.status()).toBe(200);
    expect(childRead.headers()["content-type"]).toContain("image/png");

    const parentRead = await request.get(`${apiPrefix}${uploaded.url}`, {
      headers: auth(parentToken)
    });
    expect(parentRead.status()).toBe(200);
  });
});

async function login(request: APIRequestContext, username: string) {
  const response = await request.post(`${apiPrefix}/auth/login`, {
    data: { username, password: "password123" }
  });
  expect(response.status()).toBe(200);
  return (await response.json() as { token: string }).token;
}

async function createTask(
  request: APIRequestContext,
  token: string,
  needPhoto: boolean,
  rewardPoints = 1
) {
  const response = await request.post(`${apiPrefix}/tasks`, {
    headers: auth(token),
    data: {
      subject: "数学",
      taskType: "练习",
      title: `API 任务 ${Date.now()} ${Math.random()}`,
      description: "真实路由集成测试。",
      dueDate: businessDate(),
      needPhoto,
      rewardPoints
    }
  });
  expect(response.status()).toBe(201);
  return (await response.json() as { task: { id: string } }).task.id;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function businessDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function pngFixture() {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64"
  );
}
