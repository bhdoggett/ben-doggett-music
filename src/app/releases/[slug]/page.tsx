import { notFound } from "next/navigation";
import Image from "next/image";
import NavBar from "@/components/NavBar/NavBar";
import ReleaseCard from "@/components/ReleaseCard";
import { getReleaseById, getAllReleases } from "@/data/releases";
import { SingleLayout, EPLayout } from "@/components/ReleaseLayouts";
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
          {/* Release Header */}
          <header className={styles.releaseHeader}>
            <ReleaseCard release={release} />
            {/* <div className={styles.coverArt}>
              <Image
                src={release.coverArt}
                alt={`${release.title} cover art`}
                width={400}
                height={400}
                className={styles.coverImage}
                priority
              />
            </div> */}

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
              <div className={styles.releaseMeta}>
                <span className={styles.trackCount}>
                  {release.songs.length}{" "}
                  {release.songs.length === 1 ? "track" : "tracks"}
                </span>
              </div>
            </div>
          </header>

          {/* Release Content - Different layouts for Singles vs EPs */}
          <main className={styles.releaseContent}>
            {release.type === "single" ? (
              <SingleLayout release={release} />
            ) : (
              <EPLayout release={release} />
            )}
          </main>
        </div>
      </div>
    </>
  );
}
