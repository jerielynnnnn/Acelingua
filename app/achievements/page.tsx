import type { Metadata } from "next";
import LearnerShell from "@/components/dashboard/LearnerShell";
import AchievementCollection from "@/components/achievements/AchievementCollection";
export const metadata: Metadata = { title: "Achievements | ACELingua" };
export default function AchievementsPage() { return <LearnerShell><AchievementCollection /></LearnerShell>; }
