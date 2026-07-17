"use client";

import { useMemo, useRef, useState } from "react";
import ChordChart from "@/components/ChordChart";
import { ChartEntry } from "@/types";
import { filterCharts } from "./filterCharts";
import styles from "./page.module.css";

interface ResourcesBrowserProps {
  charts: ChartEntry[];
}

export default function ResourcesBrowser({ charts }: ResourcesBrowserProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(charts[0]?.songId ?? "");
  const chartPaneRef = useRef<HTMLDivElement>(null);

  const visible = filterCharts(charts, query);
  const selected = charts.find((c) => c.songId === selectedId) ?? null;

  const selectSong = (entry: ChartEntry) => {
    setSelectedId(entry.songId);
    if (window.innerWidth < 768) {
      chartPaneRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const groups = useMemo(() => {
    const byKey = new Map<
      string,
      { title: string; type: "single" | "ep"; songs: ChartEntry[] }
    >();
    for (const entry of visible) {
      const key = entry.releaseType === "single" ? "singles" : entry.releaseId;
      const group = byKey.get(key) ?? {
        title: entry.releaseType === "single" ? "Singles" : entry.releaseTitle,
        type: entry.releaseType,
        songs: [],
      };
      group.songs.push(entry);
      byKey.set(key, group);
    }
    return Array.from(byKey.values());
  }, [visible]);

  return (
    <div className={styles.browser}>
      <input
        type="search"
        className={styles.filterInput}
        placeholder="Filter songs…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Filter songs by title"
      />
      <div className={styles.panes}>
        <nav className={styles.songList} aria-label="Songs">
          {groups.length === 0 && (
            <p className={styles.emptyList}>No songs match.</p>
          )}
          {groups.map((group) => (
            <div key={group.title} className={styles.releaseGroup}>
              <h2 className={styles.releaseTitle}>{group.title}</h2>
              <ul className={styles.songItems}>
                {group.songs.map((entry) => (
                  <li key={entry.songId}>
                    <button
                      className={
                        entry.songId === selectedId
                          ? `${styles.songButton} ${styles.songButtonActive}`
                          : styles.songButton
                      }
                      onClick={() => selectSong(entry)}
                    >
                      {entry.songTitle}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className={styles.chartPane} ref={chartPaneRef}>
          {selected ? (
            <ChordChart
              key={selected.songId}
              chordProText={selected.chordProText}
              songId={selected.songId}
              copyright={selected.copyright}
              showDownload
            />
          ) : (
            <p className={styles.emptyList}>Select a song.</p>
          )}
        </div>
      </div>
    </div>
  );
}
