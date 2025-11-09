import Link from "next/link";
import styles from "./page.module.css";
import NavBar from "../components/NavBar/NavBar";

export default function Home() {
  return (
    <div>
      <NavBar />
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Ben Doggett</h1>
          <p></p>
        </div>

        <div className={styles.ctas}>
          <Link
            href="/Releases"
            className={`btn btn-primary ${styles.primary}`}
          >
            Releases
          </Link>
          <Link href="/story" className={`btn btn-primary ${styles.primary}`}>
            Story
          </Link>
        </div>
      </main>
    </div>
  );
}
