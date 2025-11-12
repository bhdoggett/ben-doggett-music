"use client";

import React from "react";
import { useAudio } from "@/contexts/AudioContext";
import styles from "./LyricsDisplay.module.css";

interface LyricsDisplayProps {
  releaseType?: "single" | "ep";
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({ releaseType }) => {
  const { state } = useAudio();
  const selectedSong = state.selectedSong;

  if (!selectedSong) {
    return (
      <div className={styles.lyricsDisplay}>
        <div className={styles.emptyState}>
          <p>Select a track to view lyrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.lyricsDisplay}>
      <div className={styles.header}>
        <h3 className={styles.songTitle}>
          {releaseType === "ep" ? selectedSong.title : "Lyrics"}
        </h3>
      </div>

      {selectedSong.lyrics && (
        <div className={styles.lyricsContent}>
          <pre className={styles.lyrics}>{selectedSong.lyrics}</pre>
        </div>
      )}

      {selectedSong.copyright && (
        <div className={styles.copyright}>
          <p>{selectedSong.copyright}</p>
        </div>
      )}

      {!selectedSong.lyrics && !selectedSong.copyright && (
        <div className={styles.emptyState}>
          <p>No lyrics available for this track</p>
        </div>
      )}
    </div>
  );
};

export default LyricsDisplay;
