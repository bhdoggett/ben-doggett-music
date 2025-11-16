"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar/NavBar";
import ReleaseCard from "@/components/ReleaseCard";
import { getReleaseById } from "@/data/releases";
import TracksList from "@/components/TracksList";
import LyricsDisplay from "@/components/LyricsDisplay";
import ChordDisplay from "@/components/ChordDisplay";
import ViewToggle from "@/components/ViewToggle";
import { useAudio } from "@/contexts/AudioContext";
import StreamingLinks from "@/components/StreamingLinks";
import styles from "./page.module.css";

interface ReleasePageProps {
  params: Promise<{ slug: string }>;
}

export default function ReleasePage({ params }: ReleasePageProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"lyrics" | "chords">("lyrics");
  const { state } = useAudio();
  const { selectedSong } = state;

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  if (!slug) {
    return null;
  }

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
            {selectedSong && selectedSong.chordProUrl && (
              <ViewToggle
                currentView={currentView}
                onViewChange={setCurrentView}
                hasChords={!!selectedSong.chordProUrl}
              />
            )}
            {currentView === "lyrics" ? (
              <LyricsDisplay releaseType={release.type} />
            ) : (
              selectedSong?.chordProUrl && (
                <ChordDisplay chordProUrl={selectedSong.chordProUrl} />
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
