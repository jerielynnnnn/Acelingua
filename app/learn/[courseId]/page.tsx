import { notFound, redirect } from "next/navigation";

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  if (courseId === "intro") notFound();
  redirect(`/learn?course=${encodeURIComponent(courseId)}`);
}
