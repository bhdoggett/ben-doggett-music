"use client";

import React, { useState, useEffect } from "react";
import ChordChart from "@/components/ChordChart";
import { useAudio } from "@/contexts/AudioContext";
import styles from "./ChordDisplay.module.css";

interface ChordDisplayProps {
  chordProUrl: string;
  prefetchedData?: string;
  showDownload?: boolean;
}

const ChordDisplay: React.FC<ChordDisplayProps> = ({
  chordProUrl,
  prefetchedData,
  showDownload = true,
}) => {
  const [chordProText, setChordProText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const { state } = useAudio();
  const selectedSong = state.selectedSong;

  useEffect(() => {
    const fetchAndParseChordPro = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let text: string;

        if (prefetchedData) {
          text = prefetchedData;
        } else {
          const response = await fetch(chordProUrl);

          if (!response.ok) {
            if (response.status === 404) {
              throw new Error("Chord sheet not available");
            }
            throw new Error("Failed to load chord sheet");
          }

          text = await response.text();
        }

        setChordProText(text);
        setRetryCount(0);
      } catch (err) {
        if (err instanceof Error) {
          if (
            err.message.includes("Failed to fetch") ||
            err.message.includes("NetworkError")
          ) {
            setError(
              "Network error. Please check your connection and try again."
            );
          } else if (err.message === "Chord sheet not available") {
            setError("Chord sheet not available");
          } else {
            setError("Invalid chord format. Please check the ChordPro file.");
          }
        } else {
          setError("Failed to parse chord sheet");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndParseChordPro();
  }, [chordProUrl, retryCount, prefetchedData]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className={styles.chordDisplay}>
        <div className={styles.loadingSpinner}>
          <p>Loading chord sheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isNetworkError = error.includes("Network error");

    return (
      <div className={styles.chordDisplay}>
        <div className={styles.errorState}>
          <p>{error}</p>
          {isNetworkError && (
            <button className={styles.retryButton} onClick={handleRetry}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!chordProText) {
    return (
      <div className={styles.chordDisplay}>
        <div className={styles.emptyState}>
          <p>No chord sheet available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chordDisplay}>
      <ChordChart
        chordProText={chordProText}
        songId={selectedSong?.id ?? ""}
        copyright={selectedSong?.copyright}
        showDownload={showDownload}
        showFocusMode
      />
    </div>
  );
};

export default ChordDisplay;
