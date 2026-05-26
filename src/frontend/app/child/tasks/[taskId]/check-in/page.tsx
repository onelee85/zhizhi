import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getTask, statusLabel, statusTone } from "@/features/tasks/mock-data";

export default async function CheckInPage({
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
        <h1 className="mt-3 text-title-lg text-ink">{task.title}</h1>
        <p className="mt-2 text-body-sm text-muted">{task.description}</p>
      </div>

      <Card>
        <form className="grid gap-4">
          <CardTitle>完成并打卡</CardTitle>
          <label className="flex items-center gap-2">
            <input className="h-4 w-4" type="checkbox" readOnly />
            我已完成
          </label>
          <label>
            上传图片
            <input type="file" accept="image/*" multiple disabled />
          </label>
          <label>
            孩子备注
            <textarea placeholder="例如：第 5 题不会" readOnly rows={4} />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled>
              提交打卡功能待实现
            </Button>
            <ButtonLink href={`/child/tasks/${task.id}/result`} variant="secondary">
              查看提交结果占位
            </ButtonLink>
          </div>
        </form>
      </Card>
    </div>
  );
}
