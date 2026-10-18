"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import LearnerShell from "@/components/dashboard/LearnerShell";

export default function WorldLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <LearnerShell fitScreen={pathname === "/world"}>{children}</LearnerShell>;
}
