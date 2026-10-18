import { Suspense } from "react";
import WritingWorkbook from "@/components/writing/WritingWorkbook";

export default async function WorkbookPage({ params }: { params: Promise<{ language: string; lesson: string }> }) {
  const { language, lesson } = await params;
  return <Suspense fallback={<p role="status" className="p-8">Opening your workbook...</p>}><WritingWorkbook languageCode={language} lessonSlug={lesson} /></Suspense>;
}
