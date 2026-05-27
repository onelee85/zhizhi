"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { TaskForm } from "@/features/tasks/task-form";
import { ApiError, getTask } from "@/features/api/client";
import type { StudyTask } from "@/features/tasks/types";

export default function EditTaskPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<StudyTask | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getTask(taskId);
        if (active) {
          setTask(result.task);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "加载任务详情失败");
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
  }, [taskId]);

  if (isLoading) {
    return <Card className="text-body-sm text-muted">正在加载任务详情...</Card>;
  }

  if (!task) {
    return <Card className="text-body-sm text-brand-coral">{error || "任务不存在"}</Card>;
  }

  return <TaskForm task={task} />;
}
