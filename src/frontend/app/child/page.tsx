import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { statusLabel, statusTone, todayTasks } from "@/features/tasks/mock-data";

export default function ChildTasksPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-title-lg text-ink">今日任务</h1>
        <p className="mt-2 text-body-sm text-muted">孩子端静态任务清单，用于验证查看和进入打卡路径。</p>
      </div>

      <Card>
        <CardTitle>任务清单</CardTitle>
        <div className="mt-4 divide-y divide-hairline">
          {todayTasks.map((task) => (
            <Link
              key={task.id}
              href={`/child/tasks/${task.id}/check-in`}
              className="grid gap-3 py-4 hover:bg-surface-soft/50 transition-colors md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{task.subject}</Badge>
                  <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
                </div>
                <h2 className="mt-2 text-title-sm text-ink">{task.title}</h2>
                <p className="mt-1 text-body-sm text-muted">{task.description}</p>
              </div>
              <div className="text-body-sm text-muted-soft">去打卡</div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
