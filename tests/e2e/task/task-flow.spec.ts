import { Buffer } from "node:buffer";
import { expect, type Page, test } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.use({ baseURL });

type UserRole = "parent" | "child";
type TaskStatus = "pending" | "submitted" | "ai_checking" | "parent_review" | "confirmed" | "needs_resubmit";
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
    await expect(this.page.getByText(expectedRole === "parent" ? "家长 Demo" : "孩子 Demo")).toBeVisible();
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
  }) {
    await this.page.goto("/parent/tasks/new");

    await this.page.getByLabel("科目").selectOption("数学");
    await this.page.getByLabel("任务类型").selectOption("练习");
    await this.page.getByLabel("任务标题").fill(input.title);
    await this.page.getByLabel("任务说明").fill(input.description);
    await this.page.getByLabel("截止日期").fill(input.dueDate);
    await this.page.getByLabel("截止时间").fill("20:30");
    await this.page.getByLabel("奖励积分").fill(String(input.rewardPoints));
    await expect(this.page.getByLabel("需要拍照")).toBeChecked();

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
    await this.wishCard(title).getByRole("button", { name: "申请兑换" }).click();
    await expect(this.page.getByText("兑换申请已发送，等家长确认后扣积分。")).toBeVisible();
    await this.expectWishStatus(title, "redeem_requested");
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
    const result = await this.getJson<{ account: PointAccount }>("/points/account?childUserId=child-1");
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
    await expect(dialog.getByText("确认后会扣减孩子积分，并将心愿标记为已兑换。")).toBeVisible();
    await dialog.getByRole("button", { name: "确认兑换" }).click();

    await expect(this.page.getByText("已确认兑换，积分已扣减。")).toBeVisible();
    await this.expectWishStatus(title, "redeemed");
  }

  async expectWishStatus(title: string, status: WishStatus) {
    const result = await this.getJson<{ wishes: Wish[] }>("/wishes?childUserId=child-1");
    const wish = result.wishes.find((item) => item.title === title);
    expect(wish, `找到心愿：${title}`).toBeTruthy();
    expect(wish!.status).toBe(status);
    return wish!;
  }

  private wishCard(title: string) {
    return this.page.getByRole("heading", { name: title }).locator("..").locator("..");
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
    await childWishes.requestRedeem(wish.title);

    await auth.loginAsParent();
    const balanceBeforeRedeem = await parentWishes.currentBalance();
    await parentWishes.confirmRedeem(wish.title);
    await expect.poll(() => parentWishes.currentBalance(), {
      message: "家长确认兑换后扣减孩子积分"
    }).toBe(balanceBeforeRedeem - rewardPoints);
  });
});

function localDate() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function pngFixture() {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64"
  );
}
