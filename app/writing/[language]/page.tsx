import { Suspense } from "react";
import WritingStudio from "@/components/writing/WritingStudio";

export default async function WritingPage({ params }: { params: Promise<{ language: string }> }) {
  const { language } = await params;
  return <Suspense fallback={<p role="status" className="p-8">Opening Writing Studio...</p>}><WritingStudio languageCode={language} /></Suspense>;
}
