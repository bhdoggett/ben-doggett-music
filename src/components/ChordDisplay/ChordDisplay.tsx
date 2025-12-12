"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChordProParser, HtmlTableFormatter, Song } from "chordsheetjs";
import styles from "./ChordDisplay.module.css";

interface ChordDisplayProps {
  chordProUrl: string;
  releaseType?: "single" | "ep";
  prefetchedData?: string;
}

const ChordDisplay: React.FC<ChordDisplayProps> = ({
  chordProUrl,
  releaseType,
  prefetchedData,
}) => {
  const [chordSheet, setChordSheet] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [originalKey, setOriginalKey] = useState<string>("");
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [transposedSheet, setTransposedSheet] = useState<Song | null>(null);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    const fetchAndParseChordPro = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let chordProText: string;

        // Use prefetched data if available
        if (prefetchedData) {
          chordProText = prefetchedData;
        } else {
          const response = await fetch(chordProUrl);

          if (!response.ok) {
            if (response.status === 404) {
              throw new Error("Chord sheet not available");
            }
            throw new Error("Failed to load chord sheet");
          }

          chordProText = await response.text();
        }

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
  }, [chordProUrl, retryCount, prefetchedData]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const enterFocusMode = () => {
    // Store current scroll position
    scrollPositionRef.current = window.scrollY;
    setIsFocusMode(true);
    // Prevent body scroll when focus mode is active
    document.body.style.overflow = "hidden";
  };

  const exitFocusMode = () => {
    setIsFocusMode(false);
    // Restore body scroll
    document.body.style.overflow = "";
    // Restore scroll position
    setTimeout(() => {
      window.scrollTo(0, scrollPositionRef.current);
    }, 0);
  };

  // Calculate semitones between two keys
  const calculateSemitones = (fromKey: string, toKey: string): number => {
    // Map both sharps and flats to chromatic scale positions
    // Handle both major and minor keys
    const keyMap: { [key: string]: number } = {
      // Major keys
      C: 0,
      "C#": 1,
      Db: 1,
      D: 2,
      "D#": 3,
      Eb: 3,
      E: 4,
      F: 5,
      "F#": 6,
      Gb: 6,
      G: 7,
      "G#": 8,
      Ab: 8,
      A: 9,
      "A#": 10,
      Bb: 10,
      B: 11,
      // Minor keys (same chromatic positions as their major counterparts)
      Cm: 0,
      "C#m": 1,
      Dbm: 1,
      Dm: 2,
      "D#m": 3,
      Ebm: 3,
      Em: 4,
      Fm: 5,
      "F#m": 6,
      Gbm: 6,
      Gm: 7,
      "G#m": 8,
      Abm: 8,
      Am: 9,
      "A#m": 10,
      Bbm: 10,
      Bm: 11,
    };

    const fromIndex = keyMap[fromKey];
    const toIndex = keyMap[toKey];

    if (fromIndex === undefined || toIndex === undefined) {
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

  // Handle keyboard events for focus mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFocusMode) {
        exitFocusMode();
      }
    };

    if (isFocusMode) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isFocusMode]);

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

    // Determine if original key is major or minor
    const isMinorKey = originalKey.endsWith("m");

    // Define major and minor keys separately
    const majorKeys = [
      "C",
      "Db",
      "D",
      "Eb",
      "E",
      "F",
      "Gb",
      "G",
      "Ab",
      "A",
      "Bb",
      "B",
    ];

    const minorKeys = [
      "Cm",
      "Dbm",
      "Dm",
      "Ebm",
      "Em",
      "Fm",
      "Gbm",
      "Gm",
      "Abm",
      "Am",
      "Bbm",
      "Bm",
    ];

    // Only show keys of the same type as the original
    const musicalKeys = isMinorKey ? minorKeys : majorKeys;

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

            {/* Focus Mode Button */}
            <button
              className={styles.focusModeButton}
              onClick={enterFocusMode}
              title="Enter focus mode for performance"
            >
              Focus Mode
            </button>
          </div>
        </div>

        <div
          className={styles.chordContent}
          dangerouslySetInnerHTML={{ __html: formattedHtml }}
        />

        {/* Focus Mode Overlay */}
        {isFocusMode &&
          typeof window !== "undefined" &&
          createPortal(
            <div className={styles.focusModeOverlay}>
              <div className={styles.focusModeHeader}>
                <div className={styles.focusModeTitle}>
                  <h2>{title}</h2>
                  {artist && <p className={styles.focusModeArtist}>{artist}</p>}
                  <p className={styles.focusModeKey}>Key: {key}</p>
                </div>
                <button
                  className={styles.focusModeExit}
                  onClick={exitFocusMode}
                  title="Exit focus mode (ESC)"
                >
                  ✕
                </button>
              </div>
              <div
                className={styles.focusModeContent}
                dangerouslySetInnerHTML={{ __html: formattedHtml }}
              />
            </div>,
            document.body
          )}
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
