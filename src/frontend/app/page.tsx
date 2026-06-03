import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="grid gap-section">
      <section className="grid min-h-[560px] items-center gap-10 py-8 md:grid-cols-[1.1fr_0.9fr] md:py-section">
        <div className="grid gap-6">
          <p className="w-fit rounded-pill bg-canvas/90 px-4 py-2 text-caption font-semibold text-muted shadow-[inset_0_-3px_0_rgba(114,93,66,0.08)] ring-1 ring-hairline/70">
            知知小助手 · Family Learning Trail
          </p>
          <h1 className="max-w-4xl text-[42px] font-black leading-[1.08] tracking-normal text-ink md:text-[68px]">
            把今天的学习，
            <span className="relative inline-block">
              <span className="relative z-10">走成一条看得见的成长小路。</span>
              <span className="absolute bottom-2 left-0 z-0 h-4 w-full rounded-pill bg-brand-mint/55 md:bottom-3 md:h-5" />
            </span>
          </h1>
          <p className="max-w-2xl text-[18px] font-medium leading-[1.85] tracking-normal text-body md:text-[22px]">
            一张照片，是孩子完成任务的脚印；一次确认，是家长给出的温柔回声。任务、打卡、记录和反馈，都收进同一张清楚的家庭学习地图。
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

        <div className="relative overflow-hidden rounded-xl bg-surface-soft p-5 shadow-[0_18px_0_rgba(114,93,66,0.08)] ring-1 ring-white/70 md:p-8">
          <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-brand-mint/85 shadow-[inset_0_-8px_0_rgba(114,93,66,0.12)]" />
          <div className="absolute bottom-8 left-8 h-16 w-16 rotate-6 rounded-lg bg-brand-peach shadow-[inset_0_-7px_0_rgba(114,93,66,0.14)]" />
          <div className="absolute left-10 top-10 h-[78%] w-2 rounded-pill bg-canvas/80 shadow-[inset_0_0_0_1px_rgba(114,93,66,0.08)]" />
          <div className="relative grid gap-4">
            <div className="rounded-xl bg-brand-lavender p-5 shadow-[inset_0_-6px_0_rgba(114,93,66,0.12)]">
              <p className="text-caption font-bold text-ink/70">08:00 今日第一站</p>
              <h2 className="mt-3 text-[30px] font-black leading-tight tracking-normal text-ink">数学口算 20 题</h2>
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
                <span className="text-title-sm text-ink">家长回声</span>
                <span className="rounded-pill bg-brand-mint/60 px-3 py-1 text-caption text-ink">通过</span>
              </div>
              <p className="mt-2 text-body-sm text-muted">拍照内容清晰，今天的小路又向前一格。</p>
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
