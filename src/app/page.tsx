import styles from "./page.module.css";
import NavBar from "../components/NavBar/NavBar";
import FeaturedRelease from "@/components/FeaturedRelease";
import { getReleaseById } from "@/data/releases";

export default function Home() {
  const featuredRelease = getReleaseById("son-of-glory-john-1");

  if (!featuredRelease) {
    return null;
  }

  return (
    <div>
      <NavBar />
      <main className={styles.main}>
        <FeaturedRelease release={featuredRelease} />
      </main>
    </div>
  );
}
