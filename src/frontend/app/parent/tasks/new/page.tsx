import { TaskForm } from "@/features/tasks/task-form";

export default async function NewTaskPage({
  searchParams
}: {
  searchParams: Promise<{ dueDate?: string; from?: string }>;
}) {
  const params = await searchParams;
  const initialDueDate = params.dueDate?.match(/^\d{4}-\d{2}-\d{2}$/) ? params.dueDate : undefined;
  const returnHref = params.from === "calendar" ? "/parent/calendar" : undefined;

  return <TaskForm initialDueDate={initialDueDate} returnHref={returnHref} />;
}
