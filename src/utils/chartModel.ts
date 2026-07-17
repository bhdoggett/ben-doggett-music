import { ChordProParser, Tag, ChordLyricsPair } from "chordsheetjs";
import { calculateSemitones, transposeSong } from "./chords";

export interface ChartSegment {
  chord: string;
  lyrics: string;
  isComment?: boolean;
}

export type ChartItem =
  | { type: "section"; label: string }
  | { type: "line"; segments: ChartSegment[] }
  | { type: "blank" };

export interface ChartModel {
  title: string;
  key: string;
  tempo?: string;
  items: ChartItem[];
  copyright?: string;
}

export function buildChartModel(
  chordProText: string,
  targetKey: string,
  copyright?: string
): ChartModel {
  // Chart files use &nbsp;/U+00A0 as visual spacers for the HTML
  // preview; the PDF needs real spaces, replaced before parsing
  const plainText = chordProText.replace(/&nbsp;| /g, " ");
  const parsed = new ChordProParser().parse(plainText);
  const originalKey = String(parsed.metadata.key ?? "");
  const title = String(parsed.metadata.title ?? "Untitled");
  const tempo = String(parsed.metadata.tempo ?? "").trim().replace(/^~/, "").trim() || undefined;

  const song =
    originalKey && calculateSemitones(originalKey, targetKey) !== 0
      ? transposeSong(parsed, targetKey)
      : parsed;

  const items: ChartItem[] = [];

  for (const songLine of song.lines) {
    const segments: ChartSegment[] = [];
    let sectionLabel: string | null = null;

    for (const item of songLine.items) {
      if (item instanceof Tag) {
        if (item.name === "comment" && item.value) {
          if (songLine.items.length === 1) {
            sectionLabel = item.value;
          } else {
            segments.push({
              chord: "",
              lyrics: item.value,
              isComment: true,
            });
          }
        }
        // every other tag is metadata; contributes nothing
      } else if (item instanceof ChordLyricsPair) {
        const chord = item.chords.trim();
        const rawLyrics = item.lyrics ?? "";
        // Whitespace-only lyrics are visual spacers around chord
        // markers (e.g. "&nbsp;" padding in chord-only lines), not
        // real lyric content, so they're normalized away.
        const lyrics = rawLyrics.trim() ? rawLyrics : "";
        if (chord || lyrics) {
          segments.push({ chord, lyrics });
        }
      }
    }

    if (sectionLabel !== null) {
      items.push({ type: "section", label: sectionLabel });
    } else if (segments.length > 0) {
      items.push({ type: "line", segments });
    } else if (
      items.length > 0 &&
      items[items.length - 1].type !== "blank"
    ) {
      items.push({ type: "blank" });
    }
  }

  while (items.length && items[items.length - 1].type === "blank") {
    items.pop();
  }

  return { title, key: targetKey, tempo, items, copyright };
}
