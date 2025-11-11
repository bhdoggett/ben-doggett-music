"use client";

import React, { useEffect } from "react";
import { Song, Release } from "@/types";
import { useAudio } from "@/contexts/AudioContext";
import PlayButton from "@/components/PlayButton";
import styles from "./TracksList.module.css";

interface TracksListProps {
  songs: Song[];
  release: Release;
}

const TracksList: React.FC<TracksListProps> = ({ songs, release }) => {
  const { state, selectSong } = useAudio();

  // Auto-select first song whenever the release changes
  useEffect(() => {
    if (songs.length > 0) {
      selectSong(songs[0]);
    }
  }, [release.id, songs, selectSong]);

  const handleSongClick = (song: Song) => {
    selectSong(song);
  };

  const isSelected = (songId: string) => {
    return state.selectedSong?.id === songId;
  };

  return (
    <div className={styles.tracksList}>
      {/* <h2 className={styles.title}>Tracks</h2> */}
      <ul className={styles.tracks}>
        {songs.map((song) => (
          <li
            key={song.id}
            className={`${styles.track} ${isSelected(song.id) ? styles.selected : ""}`}
          >
            <div className={styles.trackContent}>
              <PlayButton song={song} release={release} />
              <button
                className={styles.trackTitle}
                onClick={() => handleSongClick(song)}
                aria-label={`Select ${song.title}`}
              >
                {song.title}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TracksList;
