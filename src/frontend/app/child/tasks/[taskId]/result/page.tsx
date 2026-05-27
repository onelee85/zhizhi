import { SubmissionResult } from "@/features/tasks/submission-result";

export default async function SubmissionResultPage({
  params
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  return <SubmissionResult taskId={taskId} />;
}
