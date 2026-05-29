"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/features/api/client";
import { useAuth } from "@/features/auth/auth-context";

export function LoginForm() {
  const auth = useAuth();
  const [username, setUsername] = useState("parent_demo");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await auth.login(username, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "登录失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 py-6 md:grid-cols-[0.95fr_1.05fr] md:items-center md:py-section">
      <section className="grid gap-5">
        <p className="w-fit rounded-pill bg-surface-card px-4 py-2 text-caption-uppercase text-muted">
          Account
        </p>
        <h1 className="text-display-md text-ink md:text-display-lg">用户名密码登录</h1>
        <p className="max-w-xl text-body-md text-body">
          使用后端 MySQL 应用用户体系登录，家长和孩子会进入各自的任务工作台。
        </p>
        <div className="grid gap-3 rounded-xl bg-brand-peach p-5">
          <p className="text-title-sm text-ink">Demo 账号</p>
          <p className="text-body-sm text-ink/75">家长：parent_demo / password123</p>
          <p className="text-body-sm text-ink/75">孩子：child_demo / password123</p>
        </div>
      </section>

      <Card className="bg-canvas/95">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <CardTitle>登录</CardTitle>
          <label>
            用户名
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="parent_demo 或 child_demo"
              autoComplete="username"
            />
          </label>
          <label>
            密码
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="text-body-sm text-brand-coral">{error}</p> : null}
          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? "登录中..." : "登录"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
