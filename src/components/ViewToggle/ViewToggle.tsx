import React from "react";
import styles from "./ViewToggle.module.css";

export interface ViewToggleProps {
  currentView: "lyrics" | "chords";
  onViewChange: (view: "lyrics" | "chords") => void;
  hasChords: boolean;
}

export default function ViewToggle({
  currentView,
  onViewChange,
  hasChords,
}: ViewToggleProps) {
  if (!hasChords) {
    return null;
  }

  return (
    <div className={styles.viewToggle} role="group" aria-label="View selection">
      <button
        type="button"
        className={`${styles.toggleButton} ${currentView === "lyrics" ? styles.active : ""}`}
        onClick={() => onViewChange("lyrics")}
        aria-pressed={currentView === "lyrics"}
        aria-label="Show lyrics view"
      >
        Lyrics
      </button>
      <button
        type="button"
        className={`${styles.toggleButton} ${currentView === "chords" ? styles.active : ""}`}
        onClick={() => onViewChange("chords")}
        aria-pressed={currentView === "chords"}
        aria-label="Show chords view"
      >
        Chords
      </button>
    </div>
  );
}
