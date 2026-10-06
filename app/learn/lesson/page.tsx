"use client";

import { Suspense } from "react";
import AuthenticatedLessonPlayer from "@/components/learning/AuthenticatedLessonPlayer";

export default function LessonPage() {
  return <Suspense fallback={<main role="status">Loading lesson...</main>}><AuthenticatedLessonPlayer /></Suspense>;
}
