import { ParentTaskDetail } from "@/features/tasks/parent-task-detail";

export default async function ParentTaskDetailPage({
  params
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  return <ParentTaskDetail taskId={taskId} />;
}
