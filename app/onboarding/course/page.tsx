import { Suspense } from "react";
import CourseOverview from "@/components/learning/CourseOverview";

export default function CoursePage() {
  return <Suspense fallback={<main role="status">Loading your course...</main>}><CourseOverview /></Suspense>;
}
