import Link from "next/link";
import NavBar from "@/components/NavBar/NavBar";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <>
      <NavBar />
      <main className={styles.main}>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.message}>
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className={styles.links}>
          <Link href="/" className={styles.link}>
            Home
          </Link>
          <Link href="/releases" className={styles.link}>
            Music
          </Link>
        </div>
      </main>
    </>
  );
}
