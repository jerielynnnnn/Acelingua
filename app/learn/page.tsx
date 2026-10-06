import { Suspense } from "react";
import CourseOverview from "@/components/learning/CourseOverview";

export default function LearnPage() {
  return <Suspense fallback={<main role="status">Loading your course...</main>}><CourseOverview requireAccount /></Suspense>;
}
