import { CheckInForm } from "@/features/tasks/check-in-form";

export default async function CheckInPage({
  params
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  return <CheckInForm taskId={taskId} />;
}
