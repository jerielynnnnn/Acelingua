import { Suspense } from "react";
import CourseRoadmap from "@/components/roadmap/CourseRoadmap";

export default function LearnPage() {
  return <Suspense fallback={<main role="status">Loading your course...</main>}><CourseRoadmap /></Suspense>;
}
