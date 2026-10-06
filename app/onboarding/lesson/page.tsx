import { Suspense } from "react";
import LessonPlayer from "@/components/learning/LessonPlayer";

export default function GuestLessonPage() {
  return <Suspense fallback={<main role="status">Loading your first lesson...</main>}><LessonPlayer /></Suspense>;
}
