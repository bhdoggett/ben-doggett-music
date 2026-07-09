import Link from "next/link";
import NavBar from "@/components/NavBar/NavBar";
import { releases } from "@/data/releases";
import ReleaseCard from "@/components/ReleaseCard";
import styles from "./page.module.css";

export default function ReleasesPage() {
  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: "Ben Doggett",
    description:
      "Musical works exploring faith, worship, and the depths of God's love",
    genre: ["Worship", "Christian", "Faith", "Devotional"],
    album: releases.map((release) => ({
      "@type": "MusicAlbum",
      name: release.title,
      description: release.description,
      albumProductionType: "https://schema.org/StudioAlbum",
      albumReleaseType:
        release.type === "ep"
          ? "https://schema.org/EPRelease"
          : "https://schema.org/SingleRelease",
      numTracks: release.songs.length,
      track: release.songs.map((song, index) => ({
        "@type": "MusicRecording",
        name: song.title,
        position: index + 1,
      })),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <NavBar />
      <div className={styles.container}>
        <main className={styles.main}>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-lg sm:gap-xl lg:gap-2xl ${styles.releaseGrid}`}
          >
            {releases.map((release) => (
              <Link
                key={release.id}
                href={`/releases/${release.id}`}
                aria-label={`View ${release.title} ${release.type}`}
              >
                <div className={styles.cardContainer}>
                  <ReleaseCard release={release} />
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
