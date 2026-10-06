import { redirect } from "next/navigation";

// Preserve old bookmarks while removing the extra confirmation/enrollment step.
export default async function CourseConfirmPage({ searchParams }: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course } = await searchParams;
  redirect(course ? `/onboarding/course?course=${encodeURIComponent(course)}` : "/onboarding/language");
}
