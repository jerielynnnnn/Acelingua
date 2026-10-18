import { Suspense } from "react";
import WritingStudio from "@/components/writing/WritingStudio";

export default async function CharacterPage({ params }: { params: Promise<{ language: string; system: string; character: string }> }) {
  const { language, system, character } = await params;
  return <Suspense fallback={<p role="status" className="p-8">Opening character...</p>}><WritingStudio languageCode={language} systemSlug={system} characterSlug={character} /></Suspense>;
}
