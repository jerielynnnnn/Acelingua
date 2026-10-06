"use client";

import { Suspense } from "react";
import LessonPlayer from "@/components/learning/LessonPlayer";

export default function LessonPage() {
  return <Suspense fallback={<main role="status">Loading lesson...</main>}><LessonPlayer authenticated /></Suspense>;
}
