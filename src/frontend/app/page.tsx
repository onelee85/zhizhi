import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="grid gap-8">
      <section className="grid gap-4 py-8">
        <p className="text-caption-uppercase text-muted">家庭学习打卡 MVP</p>
        <h1 className="max-w-3xl text-display-sm text-ink">
          家长布置任务，孩子拍照打卡，家长查看完成情况。
        </h1>
        <p className="max-w-2xl text-body-md text-body">
          当前版本已接入本地后端 API，支持用户名密码登录、任务创建、孩子打卡提交和家长审核。
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href="/login">查看登录页</ButtonLink>
          <ButtonLink href="/parent" variant="secondary">
            查看家长看板
          </ButtonLink>
          <ButtonLink href="/child" variant="secondary">
            查看孩子任务
          </ButtonLink>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card variant="peach">
          <CardTitle className="text-on-dark">家长端</CardTitle>
          <p className="mt-2 text-body-sm text-on-dark/80">
            展示今日任务数量、待确认任务、异常提示和任务详情入口。
          </p>
        </Card>
        <Card variant="lavender">
          <CardTitle className="text-ink">孩子端</CardTitle>
          <p className="mt-2 text-body-sm text-ink/80">
            展示今日任务清单、任务状态、详情和打卡页面占位。
          </p>
        </Card>
        <Card variant="ochre">
          <CardTitle className="text-ink">当前边界</CardTitle>
          <p className="mt-2 text-body-sm text-ink/80">
            图片上传仍使用 URL 联调，Qiniu、AI 检查、错题和周报将在后续阶段接入。
          </p>
        </Card>
      </section>
    </div>
  );
}
