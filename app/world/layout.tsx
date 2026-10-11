import type { ReactNode } from "react";
import LearnerShell from "@/components/dashboard/LearnerShell";

export default function WorldLayout({ children }: { children: ReactNode }) {
  return <LearnerShell>{children}</LearnerShell>;
}
