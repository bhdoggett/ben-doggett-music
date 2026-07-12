import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { ChordProParser, ChordLyricsPair } from "chordsheetjs";
import { releases } from "./releases";

const publicDir = join(__dirname, "../../public");

const songsWithCharts = releases
  .flatMap((release) => release.songs)
  .filter((song) => song.chordProUrl);

const hasChords = (parsed: ReturnType<ChordProParser["parse"]>) =>
  parsed.lines.some((line) =>
    line.items.some(
      (item) => item instanceof ChordLyricsPair && item.chords.trim() !== ""
    )
  );

describe("chordpro files", () => {
  describe.each(songsWithCharts)("$title", (song) => {
    const text = readFileSync(join(publicDir, song.chordProUrl!), "utf-8");

    it("parses as valid ChordPro", () => {
      const parsed = new ChordProParser().parse(text);
      expect(parsed.lines.length).toBeGreaterThan(0);
    });

    // Lyrics-only sheets (no chords yet) may omit the key; anything
    // with chords needs a canonical key for the transposition UI
    it("declares a canonically spelled key when it has chords", () => {
      const parsed = new ChordProParser().parse(text);
      if (hasChords(parsed)) {
        expect(
          String(parsed.metadata.key ?? ""),
          `${song.chordProUrl} has chords but no canonical {key:}`
        ).toMatch(/^[A-G][b#]?m?$/);
      }
    });
  });
});
