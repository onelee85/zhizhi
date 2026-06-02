import { CheckInForm } from "@/features/tasks/check-in-form";

export default async function CheckInPage({
  params,
  searchParams
}: {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { taskId } = await params;
  const { from } = await searchParams;
  const returnHref = from === "calendar" ? "/child/calendar" : "/child";
  const returnLabel = from === "calendar" ? "返回日历" : "返回任务清单";

  return <CheckInForm taskId={taskId} returnHref={returnHref} returnLabel={returnLabel} />;
}
