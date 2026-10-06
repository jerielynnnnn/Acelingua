"use client";

import { useParams } from "next/navigation";
import WorldExperience from "@/components/world/WorldExperience";

export default function CountryWorldPage() {
  const { languageCode } = useParams<{ languageCode: string }>();
  return <WorldExperience key={languageCode} languageCode={languageCode} />;
}
