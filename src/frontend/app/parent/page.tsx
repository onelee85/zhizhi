import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { statusLabel, statusTone, todayTasks } from "@/features/tasks/mock-data";

export default function ParentDashboardPage() {
  const total = todayTasks.length;
  const done = todayTasks.filter((task) => task.status === "confirmed").length;
  const needsResubmit = todayTasks.filter((task) => task.status === "needs_resubmit").length;
  const waitingReview = todayTasks.filter((task) => task.status === "parent_review").length;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">今日看板</h1>
          <p className="mt-2 text-sm text-slate-600">静态页面骨架，用于验证家长查看路径。</p>
        </div>
        <ButtonLink href="/parent/tasks/new">创建任务</ButtonLink>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">今日任务</p>
          <p className="mt-2 text-3xl font-semibold">{total}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">已确认</p>
          <p className="mt-2 text-3xl font-semibold">{done}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">待确认</p>
          <p className="mt-2 text-3xl font-semibold">{waitingReview}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">需补充</p>
          <p className="mt-2 text-3xl font-semibold">{needsResubmit}</p>
        </Card>
      </section>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-4">
          <CardTitle>任务列表</CardTitle>
          <span className="text-sm text-slate-500">数据为前端 mock</span>
        </div>
        <div className="divide-y divide-slate-100">
          {todayTasks.map((task) => (
            <Link
              key={task.id}
              href={`/parent/tasks/${task.id}`}
              className="grid gap-3 py-4 hover:bg-slate-50 md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{task.subject}</Badge>
                  <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
                </div>
                <h2 className="mt-2 font-medium text-slate-950">{task.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{task.description}</p>
              </div>
              <div className="text-sm text-slate-500">截止 {task.dueTime}</div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
