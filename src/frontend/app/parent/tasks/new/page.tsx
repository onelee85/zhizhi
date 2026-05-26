import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function NewTaskPage() {
  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <h1 className="text-title-lg text-ink">创建学习任务</h1>
        <p className="mt-2 text-body-sm text-muted">
          阶段 1 仅创建表单骨架，不保存任务，也不调用后端。
        </p>
      </div>

      <Card>
        <form className="grid gap-4">
          <CardTitle>任务信息</CardTitle>
          <label>
            科目
            <select defaultValue="数学" disabled>
              <option>语文</option>
              <option>数学</option>
              <option>英语</option>
            </select>
          </label>
          <label>
            任务类型
            <select defaultValue="练习" disabled>
              <option>作业</option>
              <option>预习</option>
              <option>复习</option>
              <option>错题</option>
              <option>阅读</option>
              <option>背诵</option>
              <option>练习</option>
            </select>
          </label>
          <label>
            任务标题
            <input value="完成数学计算练习第 3 页" readOnly />
          </label>
          <label>
            任务说明
            <textarea value="完成第 3 页全部计算题，订正错题并圈出不会的题。" readOnly rows={4} />
          </label>
          <label>
            截止时间
            <input value="20:30" readOnly />
          </label>
          <div className="grid gap-2 text-body-sm text-muted">
            <label className="flex items-center gap-2">
              <input className="h-4 w-4" type="checkbox" checked readOnly />
              需要拍照
            </label>
            <label className="flex items-center gap-2">
              <input className="h-4 w-4" type="checkbox" checked readOnly />
              开启 AI 检查
            </label>
          </div>
          <Button type="button" disabled>
            保存并发布功能待实现
          </Button>
        </form>
      </Card>
    </div>
  );
}
