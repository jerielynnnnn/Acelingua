"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "./WritingStudio.module.css";

export default function WritingStudioButton({ languageCode, courseId }: { languageCode: string; courseId: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const returnTo = `${pathname}${params.size ? `?${params.toString()}` : ""}`;
  const query = new URLSearchParams({ course: courseId, returnTo });
  return <div className={styles.launcher}>
    <Link href={`/writing/${encodeURIComponent(languageCode)}?${query}`} title={languageCode === "ko" ? "Learn Hangul and Korean writing" : "Learn the Alphabet"} aria-label={languageCode === "ko" ? "Open Hangul and Writing Studio" : "Learn the Alphabet"} className={styles.launchButton}>
      <BookOpen size={23} aria-hidden="true" /><span>{languageCode === "ko" ? "Hangul & Writing" : "Alphabet & Writing"}</span>
    </Link>
  </div>;
}
