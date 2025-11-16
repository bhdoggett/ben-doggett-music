"use client";

import styles from "./ViewToggle.module.css";

interface ViewToggleProps {
  currentView: "lyrics" | "chords";
  onViewChange: (view: "lyrics" | "chords") => void;
}

export default function ViewToggle({
  currentView,
  onViewChange,
}: ViewToggleProps) {
  return (
    <div className={styles.container}>
      <button
        className={`${styles.button} ${
          currentView === "lyrics" ? styles.active : ""
        }`}
        onClick={() => onViewChange("lyrics")}
        aria-pressed={currentView === "lyrics"}
      >
        Lyrics
      </button>
      <button
        className={`${styles.button} ${
          currentView === "chords" ? styles.active : ""
        }`}
        onClick={() => onViewChange("chords")}
        aria-pressed={currentView === "chords"}
      >
        Chords
      </button>
    </div>
  );
}
