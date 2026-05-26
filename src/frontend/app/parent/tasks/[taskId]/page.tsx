import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getTask, statusLabel, statusTone } from "@/features/tasks/mock-data";

export default async function ParentTaskDetailPage({
  params
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const task = getTask(taskId);

  return (
    <div className="grid gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{task.subject}</Badge>
          <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
        </div>
        <h1 className="mt-3 text-title-lg text-ink">{task.title}</h1>
        <p className="mt-2 text-body-sm text-muted">{task.description}</p>
      </div>

      <section className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle>孩子提交</CardTitle>
          <dl className="mt-4 grid gap-3 text-body-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">上传图片</dt>
              <dd className="font-medium text-ink">{task.imageCount} 张</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">孩子备注</dt>
              <dd className="font-medium text-ink">{task.childNote ?? "暂无"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">截止时间</dt>
              <dd className="font-medium text-ink">{task.dueTime}</dd>
            </div>
          </dl>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {Array.from({ length: Math.max(task.imageCount, 1) }).map((_, index) => (
              <div
                key={index}
                className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-hairline bg-surface-soft text-caption text-muted-soft"
              >
                图片占位 {index + 1}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>家长审核</CardTitle>
          <p className="mt-4 text-body-sm text-muted">
            {task.aiSummary ?? "阶段 1 暂不接入 AI 检查，仅保留结果展示区域。"}
          </p>
          {task.reviewNote ? (
            <p className="mt-3 rounded-lg bg-brand-coral/10 p-3 text-body-sm text-ink">{task.reviewNote}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" disabled>
              确认通过待实现
            </Button>
            <Button type="button" variant="secondary" disabled>
              要求补充待实现
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
