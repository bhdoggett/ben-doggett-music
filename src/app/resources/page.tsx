import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { ChordProParser } from "chordsheetjs";
import NavBar from "@/components/NavBar/NavBar";
import { releases } from "@/data/releases";
import { ChartEntry } from "@/types";
import ResourcesBrowser from "./ResourcesBrowser";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Free chord charts for Ben Doggett's worship songs — preview in any key and download as PDF.",
};

function loadChartEntries(): ChartEntry[] {
  return [...releases].reverse().flatMap((release) =>
    release.songs
      .filter((song) => song.chordProUrl)
      .map((song) => {
        const chordProText = readFileSync(
          join(process.cwd(), "public", song.chordProUrl!),
          "utf-8"
        );
        const parsed = new ChordProParser().parse(chordProText);
        return {
          songId: song.id,
          songTitle: song.title,
          releaseId: release.id,
          releaseTitle: release.title,
          releaseType: release.type,
          chordProText,
          originalKey: String(parsed.metadata.key ?? ""),
          copyright: song.copyright,
        };
      })
  );
}

export default function ResourcesPage() {
  const charts = loadChartEntries();

  return (
    <>
      <NavBar />
      <div className={styles.container}>
        <ResourcesBrowser charts={charts} />
      </div>
    </>
  );
}
