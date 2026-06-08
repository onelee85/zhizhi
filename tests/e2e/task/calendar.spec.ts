import { expect, type Page, test } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.use({ baseURL });

type UserRole = "parent" | "child";
type TaskStatus = "pending" | "submitted" | "ai_checking" | "parent_review" | "confirmed" | "needs_resubmit";

type StudyTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate?: string;
  dueTime?: string;
  rewardPoints?: number;
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

class ParentTaskEditor {
  constructor(private readonly page: Page) {}

  async createTask(input: { title: string; description: string; rewardPoints: number; dueDate: string }) {
    await this.page.goto("/parent/tasks/new");
    await this.fillTaskFields(input);

    const [createResponse] = await Promise.all([
      this.page.waitForResponse((response) =>
        response.url().includes("/api/backend/tasks") &&
        response.request().method() === "POST" &&
        response.ok()
      ),
      this.page.getByRole("button", { name: "保存并发布" }).click()
    ]);

    const { task } = await createResponse.json() as { task: StudyTask };
    await this.page.waitForURL(`**/parent/tasks/${task.id}`);
    await expect(this.page.getByRole("heading", { name: input.title })).toBeVisible();
    return task.id;
  }

  async fillTaskFields(input: { title: string; description: string; rewardPoints: number; dueDate: string }) {
    await this.page.getByLabel("科目").selectOption("数学");
    await this.page.getByLabel("任务类型").selectOption("练习");
    await this.page.getByLabel("任务标题").fill(input.title);
    await this.page.getByLabel("任务说明").fill(input.description);
    await this.page.getByLabel("截止日期").fill(input.dueDate);
    await this.page.getByLabel("截止时间").fill("20:30");
    await this.page.getByLabel("奖励积分").fill(String(input.rewardPoints));
  }
}

class CalendarPage extends AuthenticatedApp {
  async gotoParentCalendar() {
    await this.page.goto("/parent/calendar");
    await expect(this.page.getByRole("heading", { name: "家庭任务日历" })).toBeVisible();
  }

  async gotoChildCalendar() {
    await this.page.goto("/child/calendar");
    await expect(this.page.getByRole("heading", { name: "我的任务日历" })).toBeVisible();
  }

  async selectDate(date: string) {
    const dayNumber = String(Number.parseInt(date.slice(-2), 10));
    await this.page.getByRole("button", { name: dayNumber, exact: true }).click();
    await expect(this.page.getByLabel(`选择 ${date}`)).toHaveAttribute("aria-pressed", "true");
  }

  async expectCalendarContains(month: string, title: string) {
    await expect.poll(async () => {
      const result = await this.getJson<{ tasks: StudyTask[] }>(`/tasks/calendar?month=${month}`);
      return result.tasks.some((task) => task.title === title);
    }, {
      message: `日历接口返回任务：${title}`
    }).toBe(true);
  }

  async expectCalendarNotContains(month: string, title: string) {
    await expect.poll(async () => {
      const result = await this.getJson<{ tasks: StudyTask[] }>(`/tasks/calendar?month=${month}`);
      return result.tasks.some((task) => task.title === title);
    }, {
      message: `日历接口不再返回任务：${title}`
    }).toBe(false);
  }
}

test.describe("日历面板前端流程", () => {
  test("家长可以切换月份、回到今天，并从日历创建、编辑和删除未完成任务", async ({ page }) => {
    const auth = new AuthPage(page);
    const calendar = new CalendarPage(page);
    const unique = Date.now();
    const targetDate = dateInCurrentMonth(15);
    const currentMonth = targetDate.slice(0, 7);
    const nextMonth = addMonths(currentMonth, 1);
    const task = {
      title: `E2E 日历规划 ${unique}`,
      description: "从日历选中日期创建的学习任务。",
      rewardPoints: 8,
      dueDate: targetDate
    };
    const updatedTitle = `${task.title} 已编辑`;

    await auth.loginAsParent();
    await calendar.gotoParentCalendar();

    await expect(page.getByRole("heading", { name: formatMonthTitle(currentMonth), exact: true })).toBeVisible();
    await page.getByRole("button", { name: "下月" }).click();
    await expect(page.getByRole("heading", { name: formatMonthTitle(nextMonth), exact: true })).toBeVisible();
    await page.getByRole("button", { name: "今天" }).click();
    await expect(page.getByRole("heading", { name: formatMonthTitle(currentMonth), exact: true })).toBeVisible();

    await calendar.selectDate(targetDate);
    await page.getByRole("link", { name: "创建任务", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/parent/tasks/new\\?dueDate=${targetDate}&from=calendar$`));
    await expect(page.getByLabel("截止日期")).toHaveValue(targetDate);

    const editor = new ParentTaskEditor(page);
    await editor.fillTaskFields(task);
    const [createResponse] = await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes("/api/backend/tasks") &&
        response.request().method() === "POST" &&
        response.ok()
      ),
      page.getByRole("button", { name: "保存并发布" }).click()
    ]);
    const { task: createdTask } = await createResponse.json() as { task: StudyTask };
    await page.waitForURL(`**/parent/tasks/${createdTask.id}`);

    await calendar.gotoParentCalendar();
    await calendar.selectDate(targetDate);
    await expect(page.getByRole("link", { name: task.title }).first()).toBeVisible();
    await expect(page.getByText("+8 积分").first()).toBeVisible();
    await calendar.expectCalendarContains(currentMonth, task.title);

    const taskCard = page.getByRole("link", { name: task.title }).last().locator("xpath=ancestor::div[contains(@class,'border-2')][1]");
    await taskCard.getByRole("link", { name: "编辑" }).click();
    await expect(page.getByRole("heading", { name: "编辑学习任务" })).toBeVisible();
    await page.getByLabel("任务标题").fill(updatedTitle);
    await page.getByLabel("任务说明").fill("编辑后应立即同步回日历面板。");
    await page.getByLabel("奖励积分").fill("11");
    await Promise.all([
      page.waitForURL(`**/parent/tasks/${createdTask.id}`),
      page.getByRole("button", { name: "保存修改" }).click()
    ]);

    await calendar.gotoParentCalendar();
    await calendar.selectDate(targetDate);
    await expect(page.getByRole("link", { name: updatedTitle }).first()).toBeVisible();
    await expect(page.getByText("+11 积分").first()).toBeVisible();
    await calendar.expectCalendarContains(currentMonth, updatedTitle);

    const updatedTaskCard = page.getByRole("link", { name: updatedTitle }).last().locator("xpath=ancestor::div[contains(@class,'border-2')][1]");
    await updatedTaskCard.getByRole("button", { name: "删除" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(`任务：${updatedTitle}`)).toBeVisible();
    await dialog.getByRole("button", { name: "删除" }).click();
    await expect(page.getByRole("link", { name: updatedTitle })).toHaveCount(0);
    await calendar.expectCalendarNotContains(currentMonth, updatedTitle);

    await page.goto("/parent");
    await page.getByLabel("日期").fill(targetDate);
    await expect(page.getByRole("heading", { name: updatedTitle })).toHaveCount(0);
  });

  test("孩子只能只读查看自己的月任务，未来任务可查看但不能打卡", async ({ page }) => {
    const auth = new AuthPage(page);
    const unique = Date.now();
    const targetDate = addDays(7);
    const currentMonth = targetDate.slice(0, 7);
    const task = {
      title: `E2E 孩子日历 ${unique}`,
      description: "孩子端未来任务只能查看，不能提前打卡。",
      rewardPoints: 6,
      dueDate: targetDate
    };

    await auth.loginAsParent();
    const editor = new ParentTaskEditor(page);
    await editor.createTask(task);

    await auth.loginAsChild();
    const calendar = new CalendarPage(page);
    await calendar.gotoChildCalendar();
    if (currentMonth !== localDate().slice(0, 7)) {
      await page.getByRole("button", { name: "下月" }).click();
    }
    await expect(page.getByRole("heading", { name: formatMonthTitle(currentMonth), exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "创建任务" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^在 .* 创建任务$/ })).toHaveCount(0);

    await calendar.selectDate(targetDate);
    await expect(page.getByRole("link", { name: task.title }).first()).toBeVisible();
    await calendar.expectCalendarContains(currentMonth, task.title);

    await page.getByRole("link", { name: task.title }).first().click();
    await expect(page).toHaveURL(/\/child\/tasks\/.+\/check-in\?from=calendar$/);
    await expect(page.getByRole("link", { name: "返回日历" })).toBeVisible();
    await expect(page.getByRole("heading", { name: task.title })).toBeVisible();
    await expect(page.getByText("时间还没到哦")).toBeVisible();
    await expect(page.getByRole("button", { name: "提交打卡" })).toHaveCount(0);
  });

  test("390px 日历使用紧凑日期格且页面无横向滚动", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const auth = new AuthPage(page);
    const calendar = new CalendarPage(page);

    await auth.loginAsParent();
    await calendar.gotoParentCalendar();

    const monthNavigation = page.getByTestId("calendar-month-navigation");
    await expect(monthNavigation.getByRole("button", { name: "上月" })).toBeVisible();
    await expect(monthNavigation.getByRole("button", { name: "今天" })).toBeVisible();
    await expect(monthNavigation.getByRole("button", { name: "下月" })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole("navigation").getByText("任务", { exact: true })).toBeVisible();
    await expect(page.getByRole("navigation").getByText("日历", { exact: true })).toBeVisible();
    await expect(page.getByRole("navigation").getByText("心愿", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /在 .* 创建任务/ }).first()).toBeHidden();
  });
});

function dateInCurrentMonth(day: number) {
  const today = localDate();
  const month = today.slice(0, 7);
  return `${month}-${String(day).padStart(2, "0")}`;
}

function addMonths(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map((part) => Number.parseInt(part, 10));
  const next = new Date(year, monthNumber - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthTitle(month: string) {
  const [year, monthNumber] = month.split("-");
  return `${year} 年 ${Number.parseInt(monthNumber, 10)} 月`;
}

function localDate() {
  return businessDate(new Date());
}

function addDays(days: number) {
  const [year, month, day] = localDate().split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days, 12));
  return next.toISOString().slice(0, 10);
}

function businessDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}
