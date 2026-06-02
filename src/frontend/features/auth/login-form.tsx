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
    <div className="mx-auto grid max-w-5xl gap-6 py-6 md:grid-cols-[0.92fr_1.08fr] md:items-center md:py-section">
      <section className="grid gap-5 rounded-[32px] bg-[#fffdf2] p-5 shadow-[0_10px_0_rgba(114,93,66,0.08)] md:p-7">
        <div>
          <p className="w-fit rounded-pill bg-[#82d5bb] px-4 py-2 text-caption-uppercase text-white shadow-[inset_0_-3px_0_rgba(68,129,111,0.28)]">
            Account
          </p>
          <h1 className="mt-4 text-display-md tracking-normal text-ink md:text-display-lg">用户名密码登录</h1>
        </div>
        <div className="grid gap-3">
          <div className="rounded-[24px] border-2 border-[#eadfc3] bg-[#fffdf8] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-title-sm text-ink">家长 Demo</p>
              <span className="rounded-pill bg-[#f7cd67] px-3 py-1 text-caption font-bold text-[#725d42]">
                parent
              </span>
            </div>
            <p className="mt-3 text-body-sm text-muted">parent_demo / password123</p>
          </div>
          <div className="rounded-[24px] border-2 border-[#d8eee6] bg-[#f2fbf7] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-title-sm text-ink">孩子 Demo</p>
              <span className="rounded-pill bg-[#82d5bb] px-3 py-1 text-caption font-bold text-white">
                child
              </span>
            </div>
            <p className="mt-3 text-body-sm text-muted">child_demo / password123</p>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden bg-canvas/95 p-0 md:p-0">
        <div className="relative overflow-hidden border-b-2 border-[#cfe8de] bg-[#e8f8ef] px-5 py-5 md:px-6">
          <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#82d5bb]/35" />
          <div className="absolute -bottom-10 left-8 h-20 w-20 rounded-full bg-white/70" />
          <div className="relative">
            <p className="w-fit rounded-pill bg-white/80 px-3 py-1 text-caption-uppercase text-[#44816f] shadow-[inset_0_-2px_0_rgba(68,129,111,0.12)]">
              准备出发
            </p>
            <CardTitle className="mt-3 text-[#2f6f60]">登上学习岛</CardTitle>
            <p className="mt-2 text-body-sm text-[#44816f]">输入账号，开启今天的小任务。</p>
          </div>
        </div>
        <form className="grid gap-5 p-5 md:p-6" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-title-sm text-ink">用户名</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="parent_demo 或 child_demo"
              autoComplete="username"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-title-sm text-ink">密码</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </label>
          {error ? (
            <p className="rounded-[18px] bg-[#fff1eb] px-4 py-3 text-body-sm font-medium text-brand-coral">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={isSubmitting} className="zhizhi-login-submit mt-1 w-full">
            {isSubmitting ? "登录中..." : "登录"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
