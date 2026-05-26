import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="grid gap-8">
      <section className="grid gap-4">
        <p className="text-sm font-medium text-slate-500">家庭学习打卡 MVP</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-slate-950">
          家长布置任务，孩子拍照打卡，家长查看完成情况。
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          当前版本只创建阶段 1 页面骨架，使用静态数据展示核心路径，不包含后端、数据库、图片上传和提交逻辑。
        </p>
        <div className="flex flex-wrap gap-3">
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
        <Card>
          <CardTitle>家长端</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            展示今日任务数量、待确认任务、异常提示和任务详情入口。
          </p>
        </Card>
        <Card>
          <CardTitle>孩子端</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            展示今日任务清单、任务状态、详情和打卡页面占位。
          </p>
        </Card>
        <Card>
          <CardTitle>阶段限制</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            表单按钮均为占位禁用状态，不会写入数据，也不会调用 API。
          </p>
        </Card>
      </section>
    </div>
  );
}
