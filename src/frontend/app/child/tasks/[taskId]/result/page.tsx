import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getTask, statusLabel, statusTone } from "@/features/tasks/mock-data";

export default async function SubmissionResultPage({
  params
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const task = getTask(taskId);

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{task.subject}</Badge>
          <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
        </div>
        <h1 className="mt-3 text-title-lg text-ink">提交结果</h1>
        <p className="mt-2 text-body-sm text-muted">阶段 1 仅展示提交结果页面骨架。</p>
      </div>

      <Card>
        <CardTitle>{task.title}</CardTitle>
        <dl className="mt-4 grid gap-3 text-body-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">当前状态</dt>
            <dd className="font-medium text-ink">{statusLabel[task.status]}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">AI 检查</dt>
            <dd className="font-medium text-ink">待后续阶段接入</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">家长确认</dt>
            <dd className="font-medium text-ink">{task.reviewNote ?? "待家长处理"}</dd>
          </div>
        </dl>
        <div className="mt-5">
          <ButtonLink href="/child" variant="secondary">
            返回今日任务
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
