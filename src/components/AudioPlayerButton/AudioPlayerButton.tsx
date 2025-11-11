"use client";

import React from "react";
import { useAudio } from "@/contexts/AudioContext";
import { Song, Release } from "@/types";
import styles from "./AudioPlayerButton.module.css";

interface AudioPlayerButtonProps {
  song: Song;
  release: Release;
  title: string;
  showTitle?: boolean;
}

export const AudioPlayerButton: React.FC<AudioPlayerButtonProps> = ({
  song,
  release,
  title,
  showTitle = true,
}) => {
  const { state, playTrack, pauseTrack, seekTo, isCurrentTrack } = useAudio();

  const isThisTrackCurrent = isCurrentTrack(song.id);
  const isPlaying = isThisTrackCurrent && state.isPlaying;
  const isLoading = isThisTrackCurrent && state.isLoading;

  const handleClick = () => {
    if (isThisTrackCurrent && state.isPlaying) {
      pauseTrack();
    } else {
      playTrack(song, release);
    }
  };

  // Handle progress bar click
  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isThisTrackCurrent || !state.duration) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = percentage * state.duration;

    seekTo(seekTime);
  };

  return (
    <div
      className={`${styles.audioPlayerButton} ${isThisTrackCurrent ? styles.current : ""}`}
    >
      {showTitle && (
        <div className={styles.header}>
          <h4 className={styles.title}>{title}</h4>
          {isThisTrackCurrent && (
            <div className={styles.nowPlayingIndicator}>
              <div className={styles.waveform}>
                <div
                  className={`${styles.bar} ${isPlaying ? styles.animated : ""}`}
                ></div>
                <div
                  className={`${styles.bar} ${isPlaying ? styles.animated : ""}`}
                ></div>
                <div
                  className={`${styles.bar} ${isPlaying ? styles.animated : ""}`}
                ></div>
              </div>
              <span className={styles.nowPlayingText}>
                {isPlaying ? "Now Playing" : "Paused"}
              </span>
            </div>
          )}
          {state.error && isThisTrackCurrent && (
            <div className={styles.error}>{state.error}</div>
          )}
        </div>
      )}

      <div className={styles.controls}>
        <button
          className={`${styles.playButton} ${isPlaying ? styles.playing : ""} ${isThisTrackCurrent ? styles.current : ""}`}
          onClick={handleClick}
          disabled={isLoading}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <div className={styles.spinner} />
          ) : isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {isThisTrackCurrent && (
          <div className={styles.progressInfo}>
            <div
              className={styles.progressBar}
              onClick={handleProgressClick}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={state.duration}
              aria-valuenow={state.currentTime}
              aria-label="Audio progress"
            >
              <div
                className={styles.progressFill}
                style={{
                  width:
                    state.duration > 0
                      ? `${(state.currentTime / state.duration) * 100}%`
                      : "0%",
                }}
              />
            </div>
            <div className={styles.timeDisplay}>
              <span className={styles.currentTime}>
                {isLoading ? "--:--" : formatTime(state.currentTime)}
              </span>
              <span className={styles.separator}>/</span>
              <span className={styles.duration}>
                {isLoading ? "--:--" : formatTime(state.duration)}
              </span>
            </div>
          </div>
        )}
      </div>

      {!showTitle && state.error && isThisTrackCurrent && (
        <div className={styles.error}>{state.error}</div>
      )}
    </div>
  );
};

// Helper function to format time
function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default AudioPlayerButton;
