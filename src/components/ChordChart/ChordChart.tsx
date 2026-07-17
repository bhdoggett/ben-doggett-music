"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChordProParser, HtmlTableFormatter } from "chordsheetjs";
import { calculateSemitones, keysFor, transposeSong } from "@/utils/chords";
import { buildChartModel } from "@/utils/chartModel";
import { downloadChartPdf } from "@/utils/chartPdf";
import styles from "./ChordChart.module.css";

interface ChordChartProps {
  chordProText: string;
  songId: string;
  copyright?: string;
  showDownload?: boolean;
  showFocusMode?: boolean;
}

export default function ChordChart({
  chordProText,
  songId,
  copyright,
  showDownload = false,
  showFocusMode = false,
}: ChordChartProps) {
  const mainSelectId = useId();
  const focusSelectId = useId();
  const parsed = useMemo(
    () => new ChordProParser().parse(chordProText),
    [chordProText]
  );

  const originalKey = useMemo(
    () => String(parsed.metadata.key ?? ""),
    [parsed]
  );

  const songTitle = useMemo(
    () => String(parsed.metadata.title ?? "Untitled"),
    [parsed]
  );

  const tempo = useMemo(() => {
    const raw = String(parsed.metadata.tempo ?? "").trim().replace(/^~/, "").trim();
    return raw || null;
  }, [parsed]);

  const [selectedKey, setSelectedKey] = useState(originalKey);
  const [prevOriginalKey, setPrevOriginalKey] = useState(originalKey);
  if (originalKey !== prevOriginalKey) {
    setPrevOriginalKey(originalKey);
    setSelectedKey(originalKey);
  }

  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showLicenseInfo, setShowLicenseInfo] = useState(false);
  const [twoColumn, setTwoColumn] = useState(false);
  const scrollPositionRef = useRef(0);
  const infoButtonRef = useRef<HTMLButtonElement>(null);
  const licenseInfoRef = useRef<HTMLDivElement>(null);

  const chartHtml = useMemo(() => {
    const song =
      originalKey &&
      selectedKey &&
      calculateSemitones(originalKey, selectedKey) !== 0
        ? transposeSong(parsed, selectedKey)
        : parsed;
    return new HtmlTableFormatter().format(song).replace(/<h1 class="title">.*<\/h1>/, "");
  }, [parsed, originalKey, selectedKey]);

  const handleDownload = async () => {
    setPdfError(null);
    try {
      const model = buildChartModel(
        chordProText,
        selectedKey || originalKey,
        copyright
      );
      await downloadChartPdf(model, songId, twoColumn);
    } catch {
      setPdfError("PDF download failed. Please try again.");
    }
  };

  const enterFocusMode = () => {
    scrollPositionRef.current = window.scrollY;
    setIsFocusMode(true);
    document.body.style.overflow = "hidden";
  };

  const exitFocusMode = () => {
    setIsFocusMode(false);
    document.body.style.overflow = "";
    setTimeout(() => {
      window.scrollTo(0, scrollPositionRef.current);
    }, 0);
  };

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

  useEffect(() => {
    if (!showLicenseInfo) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        infoButtonRef.current &&
        !infoButtonRef.current.contains(event.target as Node) &&
        licenseInfoRef.current &&
        !licenseInfoRef.current.contains(event.target as Node)
      ) {
        setShowLicenseInfo(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowLicenseInfo(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showLicenseInfo]);

  const availableKeys = originalKey ? keysFor(originalKey) : [];

  return (
    <>
      <div className={styles.controls}>
        {showDownload && (
          <>
            <button
              ref={infoButtonRef}
              className={styles.infoButton}
              onClick={() => setShowLicenseInfo((v) => !v)}
              aria-label="Usage information"
              aria-expanded={showLicenseInfo}
            >
              ⓘ
            </button>
            {showLicenseInfo && (
              <div ref={licenseInfoRef} className={styles.licenseInfo} role="dialog">
                <p>
                  No license required, but I&apos;d love to hear from you if
                  you&apos;re singing any of my songs at your church. Reach out at{" "}
                  <a href="mailto:bendoggettsongs@gmail.com">
                    bendoggettsongs@gmail.com
                  </a>
                  .
                </p>
              </div>
            )}
            <button className={styles.downloadButton} onClick={handleDownload}>
              Download PDF
            </button>
            <button
              className={`${styles.columnButton} ${twoColumn ? styles.columnButtonActive : ""}`}
              onClick={() => setTwoColumn((v) => !v)}
              title="Toggle two-column layout"
            >
              ⫼
            </button>
          </>
        )}
        {showFocusMode && originalKey && (
          <button
            className={styles.focusModeButton}
            onClick={enterFocusMode}
            title="Enter focus mode for performance"
          >
            Focus Mode
          </button>
        )}
      </div>

      <div className={styles.chartHeader}>
        <h1 className={styles.songTitle}>{songTitle}</h1>
        <div className={styles.metaRow}>
          {originalKey ? (
            <>
              <label htmlFor={mainSelectId} className={styles.keyLabel}>
                Key:
              </label>
              <select
                id={mainSelectId}
                className={styles.keySelect}
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
              >
                {availableKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                    {k === originalKey ? " (Original)" : ""}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <span className={styles.keyLabel}>Lyrics</span>
          )}
          {tempo && <span className={styles.tempo}>{tempo} bpm</span>}
        </div>
      </div>

      {pdfError && <p className={styles.pdfError}>{pdfError}</p>}

      <div
        className={`${styles.chartContent} ${twoColumn ? styles.chartContentTwoColumn : ""}`}
        dangerouslySetInnerHTML={{ __html: chartHtml }}
      />

      {copyright && (
        <div className={styles.copyright}>
          <p>{copyright}</p>
        </div>
      )}

      {showFocusMode &&
        isFocusMode &&
        typeof window !== "undefined" &&
        createPortal(
          <div className={styles.focusModeOverlay}>
            <div className={styles.chartHeader}>
              <h1 className={styles.songTitle}>{songTitle}</h1>
              <div className={styles.metaRow}>
                <label htmlFor={focusSelectId} className={styles.keyLabel}>
                  Key:
                </label>
                <select
                  id={focusSelectId}
                  className={`${styles.keySelect} ${styles.focusModeKeySelect}`}
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                >
                  {availableKeys.map((k) => (
                    <option key={k} value={k}>
                      {k}
                      {k === originalKey ? " (Original)" : ""}
                    </option>
                  ))}
                </select>
                {tempo && <span className={styles.tempo}>{tempo} bpm</span>}
                <button
                  className={styles.focusModeExit}
                  onClick={exitFocusMode}
                  title="Exit focus mode (ESC)"
                >
                  ✕
                </button>
              </div>
            </div>
            <div
              className={styles.focusModeContent}
              dangerouslySetInnerHTML={{ __html: chartHtml }}
            />
            {copyright && (
              <div className={styles.focusModeCopyright}>
                <p>{copyright}</p>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
