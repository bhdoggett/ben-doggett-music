"use client";

import Script from "next/script";
import NavBar from "@/components/NavBar/NavBar";
import { useRouter } from "next/navigation";
import { releases } from "@/data/releases";
import ReleaseCard from "@/components/ReleaseCard";
import styles from "./page.module.css";

// Note: Metadata export doesn't work in client components,
// but we'll add it via next/head or move to a layout if needed
export default function ReleasesPage() {
  const router = useRouter();

  const handlereleaseClick = (releaseId: string) => {
    router.push(`/releases/${releaseId}`);
  };

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: "Artist Portfolio",
    description:
      "Musical works exploring faith, worship, and the depths of God's love",
    genre: ["Worship", "Christian", "Faith", "Devotional"],
    release: releases.map((release) => ({
      "@type": "Musicrelease",
      name: release.title,
      description: release.description,
      releaseProductionType: release.type === "ep" ? "Studiorelease" : "Single",
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
      <Script
        id="Releases-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <NavBar />
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Releases</h1>
        </header>

        <main className={styles.main}>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-lg sm:gap-xl lg:gap-2xl ${styles.releaseGrid}`}
          >
            {releases.map((release) => (
              <div
                key={release.id}
                onClick={() => handlereleaseClick(release.id)}
                onKeyDown={() => handlereleaseClick(release.id)}
                role="button"
                tabIndex={0}
                aria-label={`View ${release.title} ${release.type}`}
              >
                <div className={styles.cardContainer}>
                  <ReleaseCard release={release} />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
