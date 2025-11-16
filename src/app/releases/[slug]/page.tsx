import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar/NavBar";
import ReleaseCard from "@/components/ReleaseCard";
import { getReleaseById, getAllReleases } from "@/data/releases";
import TracksList from "@/components/TracksList";
import LyricsDisplay from "@/components/LyricsDisplay";
import ChordDisplay from "@/components/ChordDisplay";
import { Song } from "@/types";
import StreamingLinks from "@/components/StreamingLinks";
import styles from "./page.module.css";

// Generate static params for all releases at build time
export async function generateStaticParams() {
  const releases = getAllReleases();

  return releases.map((release) => ({
    slug: release.id,
  }));
}

// Generate metadata for each release page
export async function generateMetadata({ params }: ReleasePageProps) {
  const { slug } = await params;
  const release = getReleaseById(slug);

  if (!release) {
    return {
      title: "Release Not Found",
    };
  }

  return {
    title: `${release.title} - Artist Portfolio`,
    description:
      release.description ||
      `${release.type === "ep" ? "Extended Play" : "Single"} by Artist Portfolio`,
    openGraph: {
      title: release.title,
      description: release.description,
      images: [
        {
          url: release.coverArt,
          width: 400,
          height: 400,
          alt: `${release.title} cover art`,
        },
      ],
    },
  };
}

interface ReleasePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ReleasePage({ params }: ReleasePageProps) {
  const { slug } = await params;
  const release = getReleaseById(slug);

  if (!release) {
    notFound();
  }

  return (
    <>
      <NavBar />
      <div className={styles.container}>
        <div className={styles.releasePage}>
          {/* Cover Area */}
          <div className={styles.releaseCard}>
            <ReleaseCard release={release} />
          </div>

          {/* Header Area */}
          <header className={styles.releaseHeader}>
            <div className={styles.releaseInfo}>
              <div className={styles.titleRow}>
                <h1 className={styles.releaseTitle}>{release.title}</h1>
                <StreamingLinks streamingLinks={release.streamingLinks} />
              </div>
              {release.description && (
                <p className={styles.releaseDescription}>
                  {release.description}
                </p>
              )}
              <TracksList songs={release.songs} release={release} />
            </div>
          </header>

          {/* Lyrics Area */}
          <div className={styles.lyricsArea}>
            <LyricsDisplay releaseType={release.type} />
            <ChordDisplay chordProUrl="/assets/chordpro/example-song.txt" />
          </div>
        </div>
      </div>
    </>
  );
}
