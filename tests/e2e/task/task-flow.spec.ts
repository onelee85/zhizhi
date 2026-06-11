import { Buffer } from "node:buffer";
import { expect, type Page, test } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

test.use({ baseURL });

type UserRole = "parent" | "child";
type TaskStatus = "pending" | "parent_review" | "confirmed" | "needs_resubmit";
type WishStatus = "pending_review" | "approved" | "rejected" | "redeem_requested" | "redeemed";

type StudyTask = {
  id: string;
  title: string;
  status: TaskStatus;
  rewardPoints?: number;
  imageCount: number;
};

type PointAccount = {
  balance: number;
  totalEarned: number;
  totalSpent: number;
};

type Wish = {
  id: string;
  title: string;
  status: WishStatus;
  requiredPoints?: number;
};

class AuthPage {
  constructor(private readonly page: Page) {}

  async loginAsParent() {
    await this.login("parent_demo", "password123", "parent", "/parent");
  }

  async loginAsChild() {
    await this.login("child_demo", "password123", "child", "/child");
  }

  private async login(username: string, password: string, expectedRole: UserRole, expectedPath: string) {
    await this.page.goto("/login");
    await this.page.evaluate(() => window.localStorage.clear());
    await this.page.reload({ waitUntil: "networkidle" });

    await this.page.getByLabel("用户名").fill(username);
    await this.page.getByLabel("密码").fill(password);

    await Promise.all([
      this.page.waitForURL(`**${expectedPath}`),
      this.page.getByRole("button", { name: "登录", exact: true }).click()
    ]);

    await expect(this.page).toHaveURL(new RegExp(`${expectedPath}$`));
    await expect(this.page.getByRole("button", { name: "退出" })).toBeVisible();
  }
}

class AuthenticatedApp {
  constructor(protected readonly page: Page) {}

  protected async getJson<T>(path: string): Promise<T> {
    const token = await this.page.evaluate(() => window.localStorage.getItem("zhizhi_auth_token"));
    expect(token, "用户已登录并写入 auth token").toBeTruthy();

    const response = await this.page.request.get(`${baseURL}/api/backend${path}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.ok(), `${path} should return 2xx`).toBeTruthy();
    return response.json() as Promise<T>;
  }
}

class ParentTasksPage extends AuthenticatedApp {
  async createTask(input: {
    title: string;
    description: string;
    rewardPoints: number;
    dueDate: string;
    needPhoto?: boolean;
  }) {
    await this.page.goto("/parent/tasks/new");

    await this.page.getByLabel("科目").selectOption("数学");
    await this.page.getByLabel("任务类型").selectOption("练习");
    await this.page.getByLabel("任务标题").fill(input.title);
    await this.page.getByLabel("任务说明").fill(input.description);
    await this.page.getByLabel("截止日期").fill(input.dueDate);
    await this.page.getByLabel("截止时间").fill("20:30");
    await this.page.getByLabel("奖励积分").fill(String(input.rewardPoints));
    const photoCheckbox = this.page.getByLabel("需要拍照");
    if (input.needPhoto === false) {
      await photoCheckbox.uncheck();
    } else {
      await expect(photoCheckbox).toBeChecked();
    }

    const [createResponse] = await Promise.all([
      this.page.waitForResponse((response) =>
        response.url().includes("/api/backend/tasks") &&
        response.request().method() === "POST" &&
        response.ok()
      ),
      this.page.getByRole("button", { name: "保存并发布" }).click()
    ]);

    const { task } = await createResponse.json() as { task: StudyTask };
    const taskId = task.id;
    await this.page.waitForURL(`**/parent/tasks/${taskId}`);
    await expect(this.page.getByRole("heading", { name: input.title })).toBeVisible();
    await this.expectTaskStatus(taskId, "pending");
    return taskId;
  }

  async approveSubmittedTask(taskId: string, comment: string) {
    await this.page.goto(`/parent/tasks/${taskId}`);
    await expect(this.page.getByText("待家长确认").first()).toBeVisible();
    await expect(this.page.getByText("1 张").first()).toBeVisible();

    await this.page.getByLabel("审核备注").fill(comment);
    await this.page.getByRole("button", { name: "确认通过" }).click();

    await expect(this.page.getByText("该任务已确认通过。")).toBeVisible();
    await this.expectTaskStatus(taskId, "confirmed");
  }

  async requestResubmit(taskId: string, comment: string) {
    await this.page.goto(`/parent/tasks/${taskId}`);
    await this.page.getByLabel("审核备注").fill(comment);
    await this.page.getByRole("button", { name: "要求补充" }).click();
    await expect(this.page.getByText("已要求孩子补充提交，等待新的打卡内容。")).toBeVisible();
    await this.expectTaskStatus(taskId, "needs_resubmit");
  }

  async expectTaskStatus(taskId: string, status: TaskStatus) {
    const result = await this.getJson<{ task: StudyTask }>(`/tasks/${taskId}`);
    expect(result.task.status).toBe(status);
  }
}

class ChildTaskPage extends AuthenticatedApp {
  async submitTaskWithPhoto(taskId: string, input: { title: string; note: string }) {
    await this.page.goto(`/child/tasks/${taskId}/check-in`);
    await expect(this.page.getByRole("heading", { name: input.title })).toBeVisible();

    await this.page.getByLabel("我已完成").check();
    await this.page.getByLabel("上传图片").setInputFiles({
      name: "task-check-in.png",
      mimeType: "image/png",
      buffer: pngFixture()
    });
    await expect(this.page.getByAltText("待上传图片 1")).toBeVisible();
    await this.page.getByLabel("孩子备注").fill(input.note);

    await Promise.all([
      this.page.waitForURL(`**/child/tasks/${taskId}/result`),
      this.page.getByRole("button", { name: "提交打卡" }).click()
    ]);

    await expect(this.page.getByText("当前状态")).toBeVisible();
    await expect(this.page.getByText("待家长确认").first()).toBeVisible();
    await expect(this.page.getByText("1 张").first()).toBeVisible();
    await this.expectTaskStatus(taskId, "parent_review");
  }

  async submitTaskWithoutPhoto(taskId: string, title: string) {
    await this.page.goto(`/child/tasks/${taskId}/check-in`);
    await expect(this.page.getByRole("heading", { name: title })).toBeVisible();
    await expect(this.page.getByLabel("上传图片")).toHaveCount(0);
    await this.page.getByLabel("我已完成").check();
    await Promise.all([
      this.page.waitForURL(`**/child/tasks/${taskId}/result`),
      this.page.getByRole("button", { name: "提交打卡" }).click()
    ]);
    await this.expectTaskStatus(taskId, "parent_review");
  }

  async expectTaskStatus(taskId: string, status: TaskStatus) {
    const result = await this.getJson<{ task: StudyTask }>(`/tasks/${taskId}`);
    expect(result.task.status).toBe(status);
    return result.task;
  }
}

class ChildWishesPage extends AuthenticatedApp {
  async currentBalance() {
    const result = await this.getJson<{ account: PointAccount }>("/points/account");
    return result.account.balance;
  }

  async createWish(input: { title: string; description: string }) {
    await this.page.goto("/child/wishes/new");
    await this.page.getByLabel("心愿标题").fill(input.title);
    await this.page.getByLabel("说明").fill(input.description);

    await Promise.all([
      this.page.waitForURL("**/child/wishes"),
      this.page.getByRole("button", { name: "提交心愿" }).click()
    ]);

    await expect(this.page.getByRole("heading", { name: input.title })).toBeVisible();
    await this.expectWishStatus(input.title, "pending_review");
  }

  async requestRedeem(title: string) {
    await this.page.goto("/child/wishes");
    const wishCard = this.wishCard(title);
    await wishCard.getByRole("button", { name: "申请兑换" }).click();
    await expect(wishCard.getByRole("status")).toHaveText("积分已扣除，等待家长确认。");
    await this.expectWishStatus(title, "redeem_requested");
  }

  async expectProgress(title: string, currentPoints: number, requiredPoints: number) {
    await this.page.goto("/child/wishes");
    const card = this.wishCard(title);
    await expect(card.getByText(`当前 ${currentPoints} / 需要 ${requiredPoints}`)).toBeVisible();
    await expect(card.getByText(currentPoints >= requiredPoints ? "积分已达成" : `还差 ${requiredPoints - currentPoints} 分`)).toBeVisible();
  }

  async expectWishStatus(title: string, status: WishStatus) {
    const result = await this.getJson<{ wishes: Wish[] }>("/wishes");
    const wish = result.wishes.find((item) => item.title === title);
    expect(wish, `找到心愿：${title}`).toBeTruthy();
    expect(wish!.status).toBe(status);
    return wish!;
  }

  private wishCard(title: string) {
    return this.page.getByRole("heading", { name: title }).locator("..").locator("..");
  }
}

class ParentWishesPage extends AuthenticatedApp {
  async currentBalance() {
    const childUserId = await this.currentChildId();
    const result = await this.getJson<{ account: PointAccount }>(
      `/points/account?childUserId=${encodeURIComponent(childUserId)}`
    );
    return result.account.balance;
  }

  async approveWish(title: string, requiredPoints: number) {
    await this.page.goto("/parent/wishes");
    const card = this.wishCard(title);
    await card.getByLabel("所需积分").fill(String(requiredPoints));
    await card.getByRole("button", { name: "通过" }).click();

    await expect(this.page.getByText("已通过心愿并设置所需积分。")).toBeVisible();
    const wish = await this.expectWishStatus(title, "approved");
    expect(wish.requiredPoints).toBe(requiredPoints);
  }

  async confirmRedeem(title: string) {
    await this.page.goto("/parent/wishes");
    await this.wishCard(title).getByRole("button", { name: "确认兑换" }).click();
    const dialog = this.page.getByRole("dialog");
    await expect(dialog.getByText("孩子申请时已扣除积分，确认后会将心愿标记为已兑换。")).toBeVisible();
    await dialog.getByRole("button", { name: "确认兑换" }).click();

    await expect(this.page.getByText("已确认兑换。")).toBeVisible();
    await this.expectWishStatus(title, "redeemed");
  }

  async rejectRedeem(title: string) {
    await this.page.goto("/parent/wishes");
    await this.wishCard(title).getByRole("button", { name: "拒绝并返还积分" }).click();
    const dialog = this.page.getByRole("dialog");
    await expect(dialog.getByText("拒绝后会返还本次扣除的积分，心愿恢复为可兑换。")).toBeVisible();
    await dialog.getByPlaceholder("必须填写，孩子会看到这个原因").fill("本周场馆临时闭馆");
    await dialog.getByRole("button", { name: "拒绝并返还" }).click();

    await expect(this.page.getByText("已拒绝兑换，积分已返还。")).toBeVisible();
    await this.expectWishStatus(title, "approved");
  }

  async expectWishStatus(title: string, status: WishStatus) {
    const childUserId = await this.currentChildId();
    const result = await this.getJson<{ wishes: Wish[] }>(
      `/wishes?childUserId=${encodeURIComponent(childUserId)}`
    );
    const wish = result.wishes.find((item) => item.title === title);
    expect(wish, `找到心愿：${title}`).toBeTruthy();
    expect(wish!.status).toBe(status);
    return wish!;
  }

  private wishCard(title: string) {
    return this.page.getByRole("heading", { name: title }).locator("..").locator("..");
  }

  private async currentChildId() {
    const context = await this.getJson<{ child: { id: string } }>("/family/context");
    return context.child.id;
  }
}

test.describe("家庭学习任务完整业务流", () => {
  test("家长发布任务，孩子拍照打卡，家长审核发积分，孩子兑换心愿", async ({ page }) => {
    const auth = new AuthPage(page);
    const unique = Date.now();
    const rewardPoints = 7;
    const task = {
      title: `E2E 数学口算 ${unique}`,
      description: "完成 20 道口算题并上传作业照片。",
      rewardPoints,
      dueDate: localDate()
    };
    const wish = {
      title: `E2E 科技馆心愿 ${unique}`,
      description: "用本次任务积分兑换一次周末活动。"
    };

    await auth.loginAsChild();
    const childWishes = new ChildWishesPage(page);
    const openingBalance = await childWishes.currentBalance();

    await auth.loginAsParent();
    const parentTasks = new ParentTasksPage(page);
    const taskId = await parentTasks.createTask(task);

    await auth.loginAsChild();
    const childTasks = new ChildTaskPage(page);
    await childTasks.submitTaskWithPhoto(taskId, {
      title: task.title,
      note: "已完成口算题，照片是今天的作业。"
    });

    await auth.loginAsParent();
    await parentTasks.approveSubmittedTask(taskId, "完成清楚，确认通过。");

    await auth.loginAsChild();
    await expect.poll(() => childWishes.currentBalance(), {
      message: "任务审核通过后孩子积分增加"
    }).toBe(openingBalance + rewardPoints);

    await childWishes.createWish(wish);

    await auth.loginAsParent();
    const parentWishes = new ParentWishesPage(page);
    await parentWishes.approveWish(wish.title, rewardPoints);

    await auth.loginAsChild();
    const balanceBeforeRequest = await childWishes.currentBalance();
    await childWishes.expectProgress(wish.title, balanceBeforeRequest, rewardPoints);
    await childWishes.requestRedeem(wish.title);
    await expect.poll(() => childWishes.currentBalance(), {
      message: "孩子申请兑换时立即扣减积分"
    }).toBe(balanceBeforeRequest - rewardPoints);

    await auth.loginAsParent();
    const balanceBeforeRedeem = await parentWishes.currentBalance();
    await parentWishes.confirmRedeem(wish.title);
    await expect.poll(() => parentWishes.currentBalance(), {
      message: "家长确认兑换时不再重复扣减积分"
    }).toBe(balanceBeforeRedeem);
  });

  test("家长拒绝兑换后返还积分且孩子可以再次申请", async ({ page }) => {
    const auth = new AuthPage(page);
    const unique = Date.now();
    const rewardPoints = 6;
    const task = {
      title: `E2E 退款任务 ${unique}`,
      description: "完成任务获得用于验证心愿退款的积分。",
      rewardPoints,
      dueDate: localDate()
    };
    const wish = {
      title: `E2E 退款心愿 ${unique}`,
      description: "验证拒绝兑换后积分返还。"
    };

    await auth.loginAsParent();
    const parentTasks = new ParentTasksPage(page);
    const taskId = await parentTasks.createTask(task);

    await auth.loginAsChild();
    const childTasks = new ChildTaskPage(page);
    const childWishes = new ChildWishesPage(page);
    await childTasks.submitTaskWithPhoto(taskId, {
      title: task.title,
      note: "完成退款流程测试任务。"
    });

    await auth.loginAsParent();
    await parentTasks.approveSubmittedTask(taskId, "确认发放测试积分。");

    await auth.loginAsChild();
    const balanceBeforeRequest = await childWishes.currentBalance();
    await childWishes.createWish(wish);

    await auth.loginAsParent();
    const parentWishes = new ParentWishesPage(page);
    await parentWishes.approveWish(wish.title, rewardPoints);

    await auth.loginAsChild();
    await page.goto("/child/wishes");
    await expect(page.getByText("本周场馆临时闭馆")).toBeVisible();
    await expect(page.getByText(`已退回 ${rewardPoints} 积分`)).toBeVisible();
    await childWishes.requestRedeem(wish.title);
    await expect.poll(() => childWishes.currentBalance()).toBe(balanceBeforeRequest - rewardPoints);

    await auth.loginAsParent();
    await parentWishes.rejectRedeem(wish.title);
    await expect.poll(() => parentWishes.currentBalance(), {
      message: "家长拒绝兑换后返还积分"
    }).toBe(balanceBeforeRequest);

    await auth.loginAsChild();
    await childWishes.requestRedeem(wish.title);
    await expect.poll(() => childWishes.currentBalance(), {
      message: "退款后的心愿可以再次申请并重新扣分"
    }).toBe(balanceBeforeRequest - rewardPoints);
  });

  test("孩子能看到补充原因并直接重新打卡", async ({ page }) => {
    const auth = new AuthPage(page);
    const task = {
      title: `E2E 补充打卡 ${Date.now()}`,
      description: "验证家长补充反馈闭环。",
      rewardPoints: 0,
      dueDate: localDate()
    };

    await auth.loginAsParent();
    const parentTasks = new ParentTasksPage(page);
    const taskId = await parentTasks.createTask(task);

    await auth.loginAsChild();
    const childTasks = new ChildTaskPage(page);
    await childTasks.submitTaskWithPhoto(taskId, {
      title: task.title,
      note: "第一次提交。"
    });

    await auth.loginAsParent();
    await parentTasks.requestResubmit(taskId, "请补拍完整页面。");

    await auth.loginAsChild();
    await page.goto(`/child/tasks/${taskId}/result`);
    await expect(page.getByText("请补拍完整页面。").first()).toBeVisible();
    await page.getByRole("link", { name: "补充打卡" }).click();
    await expect(page).toHaveURL(new RegExp(`/child/tasks/${taskId}/check-in$`));
    await expect(page.getByRole("heading", { name: "完成并打卡" })).toBeVisible();
    await childTasks.submitTaskWithPhoto(taskId, {
      title: task.title,
      note: "第二次补充提交。"
    });

    await auth.loginAsParent();
    await page.goto(`/parent/tasks/${taskId}`);
    await expect(page.getByText("第 1 次提交")).toBeVisible();
    await expect(page.getByText("第 2 次提交")).toBeVisible();
    await expect(page.getByText("请补拍完整页面。")).toBeVisible();
  });

  test("不需要照片的任务可以直接提交", async ({ page }) => {
    const auth = new AuthPage(page);
    const task = {
      title: `E2E 无照片任务 ${Date.now()}`,
      description: "朗读课文后直接提交。",
      rewardPoints: 1,
      dueDate: localDate(),
      needPhoto: false
    };

    await auth.loginAsParent();
    const taskId = await new ParentTasksPage(page).createTask(task);

    await auth.loginAsChild();
    await new ChildTaskPage(page).submitTaskWithoutPhoto(taskId, task.title);
  });

  test("打卡页限制最多九张图片", async ({ page }) => {
    const auth = new AuthPage(page);
    const task = {
      title: `E2E 九图上限 ${Date.now()}`,
      description: "验证图片数量上限。",
      rewardPoints: 0,
      dueDate: localDate()
    };

    await auth.loginAsParent();
    const taskId = await new ParentTasksPage(page).createTask(task);
    await auth.loginAsChild();
    await page.goto(`/child/tasks/${taskId}/check-in`);
    await page.getByLabel("上传图片").setInputFiles(
      Array.from({ length: 10 }, (_, index) => ({
        name: `photo-${index + 1}.png`,
        mimeType: "image/png",
        buffer: pngFixture()
      }))
    );
    await expect(page.getByText("最多上传 9 张图片")).toBeVisible();
  });

  test("单张图片上传失败后可以原位重试", async ({ page }) => {
    const auth = new AuthPage(page);
    const task = {
      title: `E2E 单图重试 ${Date.now()}`,
      description: "验证单张失败提示和重试。",
      rewardPoints: 0,
      dueDate: localDate()
    };

    await auth.loginAsParent();
    const taskId = await new ParentTasksPage(page).createTask(task);
    await auth.loginAsChild();
    await page.goto(`/child/tasks/${taskId}/check-in`);

    let uploadAttempts = 0;
    await page.route("**/api/backend/uploads/photos", async (route) => {
      uploadAttempts += 1;
      if (uploadAttempts === 1) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: { code: "TEST_UPLOAD_FAILED", message: "模拟单图上传失败" } })
        });
        return;
      }
      await route.continue();
    });

    await page.getByLabel("我已完成").check();
    await page.getByLabel("上传图片").setInputFiles({
      name: "retry-photo.png",
      mimeType: "image/png",
      buffer: pngFixture()
    });
    await page.getByRole("button", { name: "提交打卡" }).click();
    await expect(page.getByText("模拟单图上传失败")).toBeVisible();
    await page.getByRole("button", { name: "重试这张" }).click();
    await expect(page.getByText("上传成功")).toBeVisible();
    await Promise.all([
      page.waitForURL(`**/child/tasks/${taskId}/result`),
      page.getByRole("button", { name: "提交打卡" }).click()
    ]);
  });

  test("历史任务页面保持只读", async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.loginAsParent();
    await page.goto("/parent/history");
    await expect(page.getByText("历史任务只读展示，不支持编辑、删除或重新提交。")).toBeVisible();
    await expect(page.getByRole("button", { name: "删除" })).toHaveCount(0);

    await auth.loginAsChild();
    await page.goto("/child/history");
    await expect(page.getByText("历史任务只读展示，不支持编辑、删除或重新提交。")).toBeVisible();
  });

  test("错误角色页面自动回到自己的任务清单", async ({ page }) => {
    const auth = new AuthPage(page);

    await auth.loginAsChild();
    await page.goto("/parent");
    await expect(page).toHaveURL(/\/child$/);

    await auth.loginAsParent();
    await page.goto("/child");
    await expect(page).toHaveURL(/\/parent$/);
  });
});

function localDate() {
  return businessDate(new Date());
}

function businessDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function pngFixture() {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64"
  );
}
