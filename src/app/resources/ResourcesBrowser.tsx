"use client";

import { useMemo, useRef, useState } from "react";
import { ChordProParser, HtmlTableFormatter } from "chordsheetjs";
import { ChartEntry } from "@/types";
import { calculateSemitones, keysFor, transposeSong } from "@/utils/chords";
import { downloadChartPdf } from "@/utils/chartPdf";
import { buildChartModel } from "@/utils/chartModel";
import { filterCharts } from "./filterCharts";
import styles from "./page.module.css";

interface ResourcesBrowserProps {
  charts: ChartEntry[];
}

export default function ResourcesBrowser({ charts }: ResourcesBrowserProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(charts[0]?.songId ?? "");
  const [selectedKey, setSelectedKey] = useState(charts[0]?.originalKey ?? "");
  const [pdfError, setPdfError] = useState<string | null>(null);
  const chartPaneRef = useRef<HTMLDivElement>(null);

  const visible = filterCharts(charts, query);
  const selected = charts.find((c) => c.songId === selectedId) ?? null;

  const chartHtml = useMemo(() => {
    if (!selected) return "";
    const parsed = new ChordProParser().parse(selected.chordProText);
    const song =
      selected.originalKey &&
      selectedKey &&
      calculateSemitones(selected.originalKey, selectedKey) !== 0
        ? transposeSong(parsed, selectedKey)
        : parsed;
    return new HtmlTableFormatter().format(song);
  }, [selected, selectedKey]);

  const selectSong = (entry: ChartEntry) => {
    setSelectedId(entry.songId);
    setSelectedKey(entry.originalKey);
    setPdfError(null);
    // On stacked (mobile) layout, bring the chart into view
    if (window.innerWidth < 768) {
      chartPaneRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDownload = async () => {
    if (!selected) return;
    setPdfError(null);
    try {
      const model = buildChartModel(
        selected.chordProText,
        selectedKey || selected.originalKey,
        selected.copyright
      );
      await downloadChartPdf(model, selected.songId);
    } catch {
      setPdfError("PDF download failed. Please try again.");
    }
  };

  // Group visible entries by release, preserving release order
  const groups = useMemo(() => {
    const byRelease = new Map<string, { title: string; songs: ChartEntry[] }>();
    for (const entry of visible) {
      const group = byRelease.get(entry.releaseId) ?? {
        title: entry.releaseTitle,
        songs: [],
      };
      group.songs.push(entry);
      byRelease.set(entry.releaseId, group);
    }
    return Array.from(byRelease.values());
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
            <>
              <div className={styles.chartControls}>
                {selected.originalKey ? (
                  <>
                    <label htmlFor="resource-key" className={styles.keyLabel}>
                      Key:
                    </label>
                    <select
                      id="resource-key"
                      className={styles.keySelect}
                      value={selectedKey}
                      onChange={(e) => setSelectedKey(e.target.value)}
                    >
                      {keysFor(selected.originalKey).map((k) => (
                        <option key={k} value={k}>
                          {k}
                          {k === selected.originalKey ? " (Original)" : ""}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <span className={styles.keyLabel}>Lyrics</span>
                )}
                <button
                  className={styles.downloadButton}
                  onClick={handleDownload}
                >
                  Download PDF
                </button>
              </div>
              {pdfError && <p className={styles.pdfError}>{pdfError}</p>}
              <div
                className={styles.chartContent}
                dangerouslySetInnerHTML={{ __html: chartHtml }}
              />
              {selected.copyright && (
                <p className={styles.copyright}>{selected.copyright}</p>
              )}
            </>
          ) : (
            <p className={styles.emptyList}>Select a song.</p>
          )}
        </div>
      </div>
    </div>
  );
}
