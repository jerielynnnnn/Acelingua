"use client";
import LearnerShell from "./LearnerShell";
import WorldExperience from "@/components/world/WorldExperience";
import styles from "./MapDashboard.module.css";

export default function JourneyDashboard() {
  return <LearnerShell simpleHeader fitScreen><main className={styles.page}>
    <h1 className="sr-only">Your world of learning</h1>
    <div className={styles.map}><WorldExperience dashboard /></div>
  </main></LearnerShell>;
}
