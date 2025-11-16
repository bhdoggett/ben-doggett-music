"use client";

import React, { useState, useEffect } from "react";
import { ChordProParser, HtmlTableFormatter, Song } from "chordsheetjs";
import styles from "./ChordDisplay.module.css";

interface ChordDisplayProps {
  chordProUrl: string;
  releaseType?: "single" | "ep";
}

const ChordDisplay: React.FC<ChordDisplayProps> = ({
  chordProUrl,
  releaseType,
}) => {
  const [chordSheet, setChordSheet] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [originalKey, setOriginalKey] = useState<string>("");
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [transposedSheet, setTransposedSheet] = useState<Song | null>(null);

  useEffect(() => {
    const fetchAndParseChordPro = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(chordProUrl);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Chord sheet not available");
          }
          throw new Error("Failed to load chord sheet");
        }

        const chordProText = await response.text();

        // Parse ChordPro file using chordsheetjs
        const parser = new ChordProParser();
        const parsedSheet = parser.parse(chordProText);

        // Extract original key from metadata
        const key = parsedSheet.metadata.key || "";
        setOriginalKey(key);
        setSelectedKey(key);

        setChordSheet(parsedSheet);
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        if (err instanceof Error) {
          // Check if it's a network error
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
  }, [chordProUrl, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Calculate semitones between two keys
  const calculateSemitones = (fromKey: string, toKey: string): number => {
    const keys = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const fromIndex = keys.indexOf(fromKey);
    const toIndex = keys.indexOf(toKey);

    if (fromIndex === -1 || toIndex === -1) {
      return 0;
    }

    return (toIndex - fromIndex + 12) % 12;
  };

  // Transpose chord sheet when selectedKey changes
  useEffect(() => {
    if (!chordSheet || !originalKey || !selectedKey) {
      setTransposedSheet(chordSheet);
      return;
    }

    const semitones = calculateSemitones(originalKey, selectedKey);

    if (semitones === 0) {
      // No transposition needed
      setTransposedSheet(chordSheet);
    } else {
      // Transpose the chord sheet
      const transposed = chordSheet.transpose(semitones);
      setTransposedSheet(transposed);
    }
  }, [chordSheet, originalKey, selectedKey]);

  // Render loading state
  if (isLoading) {
    return (
      <div className={styles.chordDisplay}>
        <div className={styles.loadingSpinner}>
          <p>Loading chord sheet...</p>
        </div>
      </div>
    );
  }

  // Render error state
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

  // Render chord sheet
  if (chordSheet && transposedSheet) {
    const formatter = new HtmlTableFormatter();
    const formattedHtml = formatter.format(transposedSheet);

    // Extract metadata
    const title = chordSheet.metadata.title || "Untitled";
    const artist = chordSheet.metadata.artist || "";
    const key = selectedKey || originalKey;

    // All 12 musical keys
    const musicalKeys = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];

    return (
      <div className={styles.chordDisplay}>
        <div className={styles.header}>
          <h3 className={styles.songTitle}>
            {releaseType === "ep" ? title : "Chords"}
          </h3>
          {artist && <p className={styles.artist}>{artist}</p>}
          {key && <p className={styles.key}>Key: {key}</p>}

          {/* Transposition Controls */}
          <div className={styles.transpositionControls}>
            <label htmlFor="key-select" className={styles.transpositionLabel}>
              Transpose to:
            </label>
            <select
              id="key-select"
              className={styles.keySelect}
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
            >
              {musicalKeys.map((k) => (
                <option key={k} value={k}>
                  {k}
                  {k === originalKey ? " (Original)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className={styles.chordContent}
          dangerouslySetInnerHTML={{ __html: formattedHtml }}
        />
      </div>
    );
  }

  return (
    <div className={styles.chordDisplay}>
      <div className={styles.emptyState}>
        <p>No chord sheet available</p>
      </div>
    </div>
  );
};

export default ChordDisplay;
