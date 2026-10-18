import Image from "next/image";
import Logo from "@/components/Logo";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./AuthFrame.module.css";

export default function AuthFrame({ children }: { children: ReactNode }) {
  return <main className={styles.page}>
    <section className={styles.panel} aria-label="ACELingua account">
      <aside className={styles.brand}>
        <Link href="/" aria-label="ACELingua home" className={styles.logo}>
          <Logo alt="ACELingua" priority sizes="240px" className="h-auto w-60 object-contain" />
        </Link>
        <div className={styles.intro}>
          <h2>Learn. Speak.<br />Explore.</h2>
          <p>Discover a new language and enjoy every step with Ace.</p>
        </div>
        <div className={styles.mascot}>
          <span className={styles.greeting}>Hello, explorer!</span>
          <Image src="/icon head.png" alt="Ace, your language learning companion" width={320} height={320} sizes="(max-width: 700px) 90px, 240px" className={styles.ace} priority />
        </div>
      </aside>
      <div className={styles.content}>
        <div className={styles.form}>{children}</div>
      </div>
    </section>
  </main>;
}
