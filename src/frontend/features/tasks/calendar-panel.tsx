"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AppButton, AppButtonLink } from "@/components/ui/button";
import { AppCard, AppCardTitle } from "@/components/ui/card";
import { AppConfirmModal } from "@/components/ui/modal";
import { ApiError, deleteTask, getCalendarTasks } from "@/features/api/client";
import { statusLabel, statusTone } from "@/features/tasks/status";
import type { StudyTask, UserRole } from "@/features/tasks/types";

type CalendarDay = {
  date: string;
  dayNumber: number;
  inMonth: boolean;
};

const weekdayLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export function TaskCalendarPanel({ role }: { role: UserRole }) {
  const today = useMemo(() => getLocalDate(), []);
  const [visibleMonth, setVisibleMonth] = useState(today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(today);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<StudyTask | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const result = await getCalendarTasks(visibleMonth);
        if (active) {
          setTasks(result.tasks);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "加载日历任务失败");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [visibleMonth]);

  const days = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const selectedTasks = tasksByDate.get(selectedDate) ?? [];
  const currentMonthTaskCount = tasks.filter((task) => task.dueDate?.startsWith(visibleMonth)).length;
  const confirmedCount = tasks.filter((task) => task.status === "confirmed").length;
  const waitingCount = tasks.filter((task) => ["submitted", "ai_checking", "parent_review"].includes(task.status)).length;
  const canManage = role === "parent";

  function goToMonth(delta: number) {
    const nextMonth = addMonths(visibleMonth, delta);
    setVisibleMonth(nextMonth);
    setSelectedDate((prev) => {
      if (prev.startsWith(nextMonth)) {
        return prev;
      }
      return `${nextMonth}-01`;
    });
  }

  function goToday() {
    setVisibleMonth(today.slice(0, 7));
    setSelectedDate(today);
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      await deleteTask(deleteTarget.id);
      setTasks((prev) => prev.filter((task) => task.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "删除任务失败");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <section className="grid gap-5 rounded-[32px] bg-[#fffdf2] p-5 shadow-[0_10px_0_rgba(114,93,66,0.08)] md:grid-cols-[1fr_auto] md:items-end md:p-6">
        <div>
          <p className="text-caption-uppercase text-muted">Calendar</p>
          <h1 className="mt-3 text-display-sm tracking-normal text-ink">
            {canManage ? "家庭任务日历" : "我的任务日历"}
          </h1>
          <p className="mt-3 max-w-2xl text-body-sm text-body">
            月视图按日期汇总学习任务，点击日期查看当天任务，点击任务进入处理页面。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <AppButton type="button" variant="secondary" className="px-3" onClick={() => goToMonth(-1)}>
            上月
          </AppButton>
          <AppButton type="button" variant="secondary" className="px-3" onClick={goToday}>
            今天
          </AppButton>
          <AppButton type="button" variant="secondary" className="px-3" onClick={() => goToMonth(1)}>
            下月
          </AppButton>
          {canManage ? (
            <AppButtonLink href={`/parent/tasks/new?dueDate=${selectedDate}&from=calendar`} className="col-span-3 sm:col-span-1">
              创建任务
            </AppButtonLink>
          ) : null}
        </div>
      </section>

      {error ? <AppCard className="text-body-sm text-brand-coral">{error}</AppCard> : null}

      <section className="grid grid-cols-3 gap-3">
        <AppCard variant="ochre" className="text-[#725d42]">
          <p className="text-caption text-[#725d42]/70">本月任务</p>
          <p className="mt-2 text-display-sm tracking-normal text-[#725d42]">
            {isLoading ? "-" : currentMonthTaskCount}
          </p>
        </AppCard>
        <AppCard variant="teal" className="text-white">
          <p className="text-caption text-white/75">已确认</p>
          <p className="mt-2 text-display-sm tracking-normal text-white">{isLoading ? "-" : confirmedCount}</p>
        </AppCard>
        <AppCard variant="peach" className="text-white">
          <p className="text-caption text-white/75">待处理</p>
          <p className="mt-2 text-display-sm tracking-normal text-white">{isLoading ? "-" : waitingCount}</p>
        </AppCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <AppCard className="overflow-hidden p-0 md:p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#eadfc3] px-4 py-4 md:px-5">
            <div>
              <AppCardTitle>{formatMonthTitle(visibleMonth)}</AppCardTitle>
            </div>
            <div className="inline-flex rounded-full border-2 border-[#eadfc3] bg-[#fffdf8] p-1 text-caption text-muted">
              <button type="button" className="rounded-full px-3 py-2 hover:bg-[#f7f0d8]" onClick={() => goToMonth(-1)}>
                ‹
              </button>
              <button type="button" className="rounded-full px-3 py-2 hover:bg-[#f7f0d8]" onClick={goToday}>
                今
              </button>
              <button type="button" className="rounded-full px-3 py-2 hover:bg-[#f7f0d8]" onClick={() => goToMonth(1)}>
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b-2 border-[#eadfc3] bg-[#f7f0d8]">
            {weekdayLabels.map((label) => (
              <div key={label} className="px-1 py-2 text-center text-caption font-bold text-muted md:px-3">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-[#eadfc3] gap-px">
            {days.map((day) => {
              const dayTasks = tasksByDate.get(day.date) ?? [];
              const isToday = day.date === today;
              const isSelected = day.date === selectedDate;

              return (
                <div
                  key={day.date}
                  className={[
                    "relative min-h-[92px] bg-[#fffdf8] p-1.5 transition md:min-h-[132px] md:p-2.5",
                    day.inMonth ? "" : "bg-[#f7f0d8] text-muted-soft",
                    isSelected ? "z-10 ring-2 ring-inset ring-[#82d5bb]" : ""
                  ].join(" ")}
                >
                  <button
                    type="button"
                    className="absolute inset-0 z-0"
                    aria-label={`选择 ${day.date}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDate(day.date)}
                  />
                  <div className="relative z-10 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      className={[
                        "grid h-8 w-8 place-items-center rounded-full text-caption font-bold transition",
                        isToday ? "bg-[#82d5bb] text-white shadow-[inset_0_-3px_0_rgba(68,129,111,0.35)]" : "text-[#725d42]",
                        isSelected && !isToday ? "bg-[#f7cd67] text-[#725d42]" : ""
                      ].join(" ")}
                      onClick={() => setSelectedDate(day.date)}
                    >
                      {day.dayNumber}
                    </button>
                    {canManage && day.inMonth ? (
                      <Link
                        href={`/parent/tasks/new?dueDate=${day.date}&from=calendar`}
                        className="grid h-7 w-7 place-items-center rounded-full bg-[#fffdf2] text-title-sm font-bold text-[#725d42] shadow-[inset_0_-2px_0_rgba(114,93,66,0.12)] transition hover:bg-[#f7cd67]"
                        aria-label={`在 ${day.date} 创建任务`}
                      >
                        +
                      </Link>
                    ) : null}
                  </div>
                  <div className="relative z-10 mt-2 grid gap-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <Link
                        key={task.id}
                        href={getTaskHref(role, task)}
                        className={[
                          "truncate rounded-full px-2 py-1 text-left text-[11px] font-bold leading-tight transition hover:-translate-y-0.5 md:text-caption",
                          getTaskChipClass(task.status)
                        ].join(" ")}
                      >
                        {task.dueTime ? `${task.dueTime} ` : ""}
                        {task.title}
                      </Link>
                    ))}
                    {dayTasks.length > 3 ? (
                      <button
                        type="button"
                        className="rounded-full bg-[#f7f0d8] px-2 py-1 text-left text-[11px] font-bold text-muted md:text-caption"
                        onClick={() => setSelectedDate(day.date)}
                      >
                        还有 {dayTasks.length - 3} 项
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </AppCard>

        <SelectedDatePanel
          canManage={canManage}
          date={selectedDate}
          role={role}
          tasks={selectedTasks}
          onDelete={(task) => setDeleteTarget(task)}
        />
      </section>

      <AppConfirmModal
        open={Boolean(deleteTarget)}
        title="删除任务"
        description="确定要删除这个任务吗？删除后日历和任务列表都会同步移除。"
        detail={deleteTarget ? `任务：${deleteTarget.title}` : undefined}
        confirmText="删除"
        loading={isDeleting}
        tone="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

function SelectedDatePanel({
  canManage,
  date,
  role,
  tasks,
  onDelete
}: {
  canManage: boolean;
  date: string;
  role: UserRole;
  tasks: StudyTask[];
  onDelete: (task: StudyTask) => void;
}) {
  return (
    <AppCard className="xl:sticky xl:top-28 xl:self-start">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-caption-uppercase text-muted">Selected day</p>
          <AppCardTitle className="mt-2">{formatDateTitle(date)}</AppCardTitle>
        </div>
        {canManage ? (
          <AppButtonLink href={`/parent/tasks/new?dueDate=${date}&from=calendar`} size="small">
            创建
          </AppButtonLink>
        ) : null}
      </div>
      <div className="mt-5 grid gap-3">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-[22px] border-2 border-[#eadfc3] bg-[#fffdf8] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{task.subject}</Badge>
              <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
              {task.rewardPoints ? <Badge tone="success">+{task.rewardPoints} 积分</Badge> : null}
            </div>
            <Link href={getTaskHref(role, task)} className="mt-3 block text-title-sm text-ink hover:text-[#44816f]">
              {task.title}
            </Link>
            <p className="mt-1 line-clamp-2 text-body-sm text-muted">{task.description}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-caption text-muted-soft">
              <span>{task.dueTime ? `截止 ${task.dueTime}` : "当天完成"}</span>
              {canManage ? (
                <span className="flex items-center gap-2">
                  {isIncompleteTask(task) ? (
                    <>
                      <Link href={`/parent/tasks/${task.id}/edit`} className="font-bold text-[#725d42] hover:text-[#44816f]">
                        编辑
                      </Link>
                      <button
                        type="button"
                        className="font-bold text-brand-coral hover:text-[#c94a40]"
                        onClick={() => onDelete(task)}
                      >
                        删除
                      </button>
                    </>
                  ) : null}
                </span>
              ) : null}
            </div>
          </div>
        ))}
        {tasks.length === 0 ? (
          <p className="rounded-[22px] border-2 border-dashed border-[#eadfc3] bg-[#fffdf8] px-4 py-8 text-center text-body-sm text-muted">
            {canManage ? "这一天还没有任务，可以直接创建。" : "这一天没有分配给你的任务。"}
          </p>
        ) : null}
      </div>
    </AppCard>
  );
}

function buildCalendarDays(month: string) {
  const [year, monthNumber] = month.split("-").map((part) => Number.parseInt(part, 10));
  const firstDay = new Date(year, monthNumber - 1, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, monthNumber - 1, 1 - mondayOffset);
  const days: CalendarDay[] = [];

  for (let index = 0; index < 42; index += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const date = toDateKey(current);
    days.push({
      date,
      dayNumber: current.getDate(),
      inMonth: date.startsWith(month)
    });
  }

  return days;
}

function groupTasksByDate(tasks: StudyTask[]) {
  const grouped = new Map<string, StudyTask[]>();

  for (const task of tasks) {
    if (!task.dueDate) {
      continue;
    }

    const dateTasks = grouped.get(task.dueDate) ?? [];
    dateTasks.push(task);
    grouped.set(task.dueDate, dateTasks);
  }

  return grouped;
}

function addMonths(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map((part) => Number.parseInt(part, 10));
  const next = new Date(year, monthNumber - 1 + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function getLocalDate() {
  return toDateKey(new Date());
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMonthTitle(month: string) {
  const [year, monthNumber] = month.split("-");
  return `${year} 年 ${Number.parseInt(monthNumber, 10)} 月`;
}

function formatDateTitle(date: string) {
  const [year, month, day] = date.split("-");
  return `${year} 年 ${Number.parseInt(month, 10)} 月 ${Number.parseInt(day, 10)} 日`;
}

function getTaskHref(role: UserRole, task: StudyTask) {
  if (role === "parent") {
    return `/parent/tasks/${task.id}?from=calendar`;
  }

  return isChildCompleted(task) ? `/child/tasks/${task.id}/result` : `/child/tasks/${task.id}/check-in`;
}

function isChildCompleted(task: StudyTask) {
  return ["submitted", "ai_checking", "parent_review", "confirmed"].includes(task.status);
}

function isIncompleteTask(task: StudyTask) {
  return task.status === "pending" || task.status === "needs_resubmit";
}

function getTaskChipClass(status: StudyTask["status"]) {
  if (status === "confirmed") {
    return "bg-[#dff3ea] text-[#44816f]";
  }

  if (status === "needs_resubmit") {
    return "bg-[#fff1eb] text-brand-coral";
  }

  if (status === "submitted" || status === "ai_checking" || status === "parent_review") {
    return "bg-[#fff3c9] text-[#725d42]";
  }

  return "bg-[#f7f0d8] text-[#725d42]";
}
