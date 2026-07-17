"use client";

import { useState, useEffect } from "react";
import ReleaseCard from "@/components/ReleaseCard";
import TracksList from "@/components/TracksList";
import LyricsDisplay from "@/components/LyricsDisplay";
import ChordDisplay from "@/components/ChordDisplay";
import ViewToggle from "@/components/ViewToggle";
import { useAudio } from "@/contexts/AudioContext";
import StreamingLinks from "@/components/StreamingLinks";
import { Release } from "@/types";
import styles from "./page.module.css";

interface ReleaseViewProps {
  release: Release;
}

export default function ReleaseView({ release }: ReleaseViewProps) {
  const [currentView, setCurrentView] = useState<"lyrics" | "chords">("lyrics");
  const [chordDataCache, setChordDataCache] = useState<Record<string, string>>(
    {}
  );
  const { state } = useAudio();
  const { selectedSong } = state;

  // Prefetch chord data when a song with chordProUrl is selected
  useEffect(() => {
    if (
      selectedSong?.chordProUrl &&
      !chordDataCache[selectedSong.chordProUrl]
    ) {
      fetch(selectedSong.chordProUrl)
        .then((response) => {
          if (response.ok) {
            return response.text();
          }
          throw new Error("Failed to fetch");
        })
        .then((text) => {
          setChordDataCache((prev) => ({
            ...prev,
            [selectedSong.chordProUrl!]: text,
          }));
        })
        .catch(() => {
          // Silently fail - ChordDisplay will handle the error
        });
    }
  }, [selectedSong, chordDataCache]);

  // Reset view to lyrics when a new song is selected
  useEffect(() => {
    if (selectedSong) {
      setCurrentView("lyrics");
    }
  }, [selectedSong]);

  return (
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
          <div
            style={{
              display: currentView === "lyrics" ? "block" : "none",
            }}
          >
            <LyricsDisplay releaseType={release.type} />
          </div>
          {selectedSong?.chordProUrl && (
            <div
              style={{
                display: currentView === "chords" ? "block" : "none",
              }}
            >
              <ChordDisplay
                chordProUrl={selectedSong.chordProUrl}
                prefetchedData={chordDataCache[selectedSong.chordProUrl]}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
