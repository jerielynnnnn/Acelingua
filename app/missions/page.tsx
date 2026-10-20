import type {Metadata} from "next";
import LearnerShell from "@/components/dashboard/LearnerShell";
import QuestBoard from "@/components/missions/QuestBoard";
export const metadata:Metadata={title:"Daily Learning Quests | ACELingua"};
export default function MissionsPage(){return <LearnerShell><QuestBoard/></LearnerShell>;}
