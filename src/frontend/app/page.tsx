import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="grid gap-section">
      <section className="grid min-h-[560px] items-center gap-10 py-8 md:grid-cols-[1.1fr_0.9fr] md:py-section">
        <div className="grid gap-6">
          <p className="w-fit rounded-pill bg-surface-card px-4 py-2 text-caption-uppercase text-muted">
            家庭学习打卡 MVP
          </p>
          <h1 className="max-w-4xl text-[44px] font-medium leading-[1.05] tracking-[-1.5px] text-ink md:text-display-xl">
            每天的学习任务，变成一条清楚的完成线。
          </h1>
          <p className="max-w-2xl text-body-md text-body md:text-title-md md:font-normal">
            家长布置任务，孩子拍照打卡，系统记录提交状态，家长在同一个界面完成确认和补充反馈。
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <ButtonLink href="/login">进入系统</ButtonLink>
            <ButtonLink href="/parent" variant="secondary">
              家长看板
            </ButtonLink>
            <ButtonLink href="/child" variant="secondary">
              孩子任务
            </ButtonLink>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-surface-soft p-5 md:p-8">
          <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-brand-mint" />
          <div className="absolute bottom-8 left-8 h-16 w-16 rounded-lg bg-brand-peach rotate-6" />
          <div className="relative grid gap-4">
            <div className="rounded-xl bg-brand-lavender p-5">
              <p className="text-caption-uppercase text-ink/70">今日计划</p>
              <h2 className="mt-3 text-display-sm text-ink">数学口算 20 题</h2>
              <div className="mt-5 grid gap-2 rounded-lg bg-canvas/85 p-4">
                <div className="h-3 w-4/5 rounded-pill bg-ink/80" />
                <div className="h-3 w-2/3 rounded-pill bg-ink/30" />
                <div className="h-3 w-1/2 rounded-pill bg-ink/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-brand-ochre p-4">
                <p className="text-caption text-ink/70">待确认</p>
                <p className="mt-2 text-display-sm text-ink">3</p>
              </div>
              <div className="rounded-lg bg-brand-teal p-4 text-on-dark">
                <p className="text-caption text-on-dark/70">已完成</p>
                <p className="mt-2 text-display-sm text-on-dark">8</p>
              </div>
            </div>
            <div className="rounded-xl bg-canvas p-4 ring-1 ring-hairline">
              <div className="flex items-center justify-between gap-3">
                <span className="text-title-sm text-ink">家长审核</span>
                <span className="rounded-pill bg-brand-mint/60 px-3 py-1 text-caption text-ink">通过</span>
              </div>
              <p className="mt-2 text-body-sm text-muted">拍照内容清晰，任务完成记录已入库。</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card variant="pink" className="min-h-56">
          <CardTitle className="text-on-dark">家长端</CardTitle>
          <p className="mt-3 text-body-sm text-on-dark/85">
            展示任务总览、待确认、需补充和任务详情入口，支持创建、编辑和删除未完成任务。
          </p>
          <div className="mt-8 rounded-lg bg-canvas/90 p-4 text-ink">
            <p className="text-caption text-muted">今日任务</p>
            <p className="mt-1 text-display-sm">12</p>
          </div>
        </Card>
        <Card variant="lavender" className="min-h-56">
          <CardTitle className="text-ink">孩子端</CardTitle>
          <p className="mt-3 text-body-sm text-ink/80">
            展示今日任务清单、任务状态、打卡提交和提交结果，流程保持轻量清楚。
          </p>
          <div className="mt-8 grid gap-2 rounded-lg bg-canvas/75 p-4">
            <div className="h-3 rounded-pill bg-ink/70" />
            <div className="h-3 w-2/3 rounded-pill bg-ink/20" />
          </div>
        </Card>
        <Card variant="ochre" className="min-h-56">
          <CardTitle className="text-ink">当前边界</CardTitle>
          <p className="mt-3 text-body-sm text-ink/80">
            图片上传仍使用 URL 联调，Qiniu、AI 检查、错题和周报将在后续阶段接入。
          </p>
          <ButtonLink href="/parent" variant="secondary" className="mt-8">
            查看进度
          </ButtonLink>
        </Card>
      </section>
    </div>
  );
}
