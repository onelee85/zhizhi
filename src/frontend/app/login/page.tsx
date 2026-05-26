import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="mx-auto grid max-w-md gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">用户名密码登录</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          阶段 1 仅展示登录入口骨架，认证逻辑将在后续接入 MySQL 用户体系时实现。
        </p>
      </div>

      <Card>
        <form className="grid gap-4">
          <CardTitle>登录</CardTitle>
          <label>
            用户名
            <input placeholder="parent_demo 或 child_demo" readOnly />
          </label>
          <label>
            密码
            <input type="password" placeholder="暂未接入认证" readOnly />
          </label>
          <Button type="button" disabled>
            登录功能待实现
          </Button>
        </form>
      </Card>
    </div>
  );
}
