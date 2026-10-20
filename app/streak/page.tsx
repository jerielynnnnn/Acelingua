import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadStreak } from "@/lib/streak-data";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StreakSociety from "@/components/streak/StreakSociety";
import StreakRetry from "@/components/streak/StreakRetry";
import styles from "@/components/streak/StreakSociety.module.css";

export const metadata: Metadata={title:"Streak Society | ACELingua"};
export default async function StreakPage({searchParams}:{searchParams:Promise<{month?:string|string[]}>}) {
  const client=await createClient();
  const {data:{user},error}=await client.auth.getUser();
  if(!user && !error) redirect("/login");
  if(!user && error?.name==="AuthSessionMissingError") redirect("/login");
  const params=await searchParams;
  let data;
  let failure="";
  if(error) failure="We couldn't check your account. Please try again.";
  else if(user) {
    try {data=await loadStreak(client,user.id,typeof params.month==="string"?params.month:undefined);}
    catch(cause) {failure=cause instanceof Error?cause.message:"We couldn't load your streak.";}
  }
  return <div className={styles.shell}><DashboardSidebar /><div className={styles.content}>
    {data && <DashboardHeader {...data.profile} achievements={null} />}
    <main className={styles.page}><nav className={styles.breadcrumb} aria-label="Streak navigation"><Link href="/dashboard">Dashboard</Link><span aria-hidden="true">/</span><span>Streak Society</span></nav>
    {data ? <StreakSociety data={data} /> : <section className={styles.card}><h1>Your streak is worth coming back to</h1><p role="alert">{failure || "We couldn't load your account."}</p><StreakRetry /></section>}
    </main>
  </div></div>;
}
