import { SubmissionResult } from "@/features/tasks/submission-result";

export default async function SubmissionResultPage({
  params,
  searchParams
}: {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { taskId } = await params;
  const { from } = await searchParams;
  const returnHref = from === "calendar" ? "/child/calendar" : from === "history" ? "/child/history" : "/child";
  const returnLabel = from === "calendar" ? "返回日历" : from === "history" ? "返回历史任务" : "返回任务清单";

  return <SubmissionResult taskId={taskId} returnHref={returnHref} returnLabel={returnLabel} />;
}
