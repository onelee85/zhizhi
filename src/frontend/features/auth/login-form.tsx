"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ApiError, login, storeSession } from "@/features/api/client";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("parent_demo");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = await login(username, password);
      storeSession(session.token, session.user);
      router.push(session.user.role === "parent" ? "/parent" : "/child");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "登录失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-md gap-6">
      <div>
        <h1 className="text-title-lg text-ink">用户名密码登录</h1>
        <p className="mt-2 text-body-sm text-muted">使用后端 MySQL 应用用户体系登录。</p>
      </div>

      <Card>
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "登录中..." : "登录"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
