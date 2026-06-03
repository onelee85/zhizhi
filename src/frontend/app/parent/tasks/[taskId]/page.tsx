import { ParentTaskDetail } from "@/features/tasks/parent-task-detail";

export default async function ParentTaskDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { taskId } = await params;
  const { from } = await searchParams;
  const returnHref = from === "calendar" ? "/parent/calendar" : from === "history" ? "/parent/history" : "/parent";

  return <ParentTaskDetail taskId={taskId} returnHref={returnHref} />;
}
