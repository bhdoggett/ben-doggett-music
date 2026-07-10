import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { ChordProParser } from "chordsheetjs";
import { releases } from "./releases";

const publicDir = join(__dirname, "../../public");

const songsWithCharts = releases
  .flatMap((release) => release.songs)
  .filter((song) => song.chordProUrl);

describe("chordpro files", () => {
  describe.each(songsWithCharts)("$title", (song) => {
    const text = readFileSync(join(publicDir, song.chordProUrl!), "utf-8");

    it("parses as valid ChordPro", () => {
      const parsed = new ChordProParser().parse(text);
      expect(parsed.lines.length).toBeGreaterThan(0);
    });

    it("declares a key (transposition UI needs it)", () => {
      const parsed = new ChordProParser().parse(text);
      expect(
        parsed.metadata.key,
        `${song.chordProUrl} has no {key:} directive`
      ).toBeTruthy();
    });

    it("declares a canonically spelled key (A-G, optional b/#, optional m)", () => {
      const parsed = new ChordProParser().parse(text);
      expect(String(parsed.metadata.key)).toMatch(/^[A-G][b#]?m?$/);
    });
  });
});
