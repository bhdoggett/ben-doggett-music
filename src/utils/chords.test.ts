import { describe, it, expect } from "vitest";
import { ChordProParser, Song } from "chordsheetjs";
import { calculateSemitones, transposeSong } from "./chords";

// Collect every chord symbol appearing in a parsed song
function chordsIn(song: Song): string[] {
  const chords: string[] = [];
  for (const line of song.lines) {
    for (const item of line.items) {
      if ("chords" in item && item.chords) {
        chords.push(item.chords as string);
      }
    }
  }
  return chords;
}

function parse(chordPro: string): Song {
  return new ChordProParser().parse(chordPro);
}

describe("calculateSemitones", () => {
  it("counts semitones upward between major keys", () => {
    expect(calculateSemitones("C", "D")).toBe(2);
    expect(calculateSemitones("C", "Db")).toBe(1);
    expect(calculateSemitones("G", "C")).toBe(5); // wraps past B
  });

  it("treats enharmonic keys as equal", () => {
    expect(calculateSemitones("C#", "Db")).toBe(0);
  });

  it("handles minor keys", () => {
    expect(calculateSemitones("Am", "Bm")).toBe(2);
    expect(calculateSemitones("Em", "Cm")).toBe(8);
  });

  it("returns 0 for unknown keys", () => {
    expect(calculateSemitones("H", "C")).toBe(0);
  });
});

describe("transposeSong", () => {
  const song = parse("{key: C}\n[C]Sing [F]to [G]the [Am]Lord");

  it("spells chords with flats when the target key is a flat key", () => {
    // C -> Db: chords must be Db Gb Ab Bbm, never C# F# G# A#m
    const transposed = transposeSong(song, "Db");
    expect(chordsIn(transposed)).toEqual(["Db", "Gb", "Ab", "Bbm"]);
  });

  it("spells chords with sharps when the target key is a sharp key", () => {
    // C -> E: E major has 4 sharps, so expect C#m rather than Dbm
    const transposed = transposeSong(song, "E");
    expect(chordsIn(transposed)).toEqual(["E", "A", "B", "C#m"]);
  });

  it("transposes minor keys with the target key's spelling", () => {
    const minorSong = parse("{key: Am}\n[Am]Why so [Dm]downcast [E]my soul");
    const transposed = transposeSong(minorSong, "Cm");
    expect(chordsIn(transposed)).toEqual(["Cm", "Fm", "G"]);
  });

  it("returns an equivalent song when target equals the original key", () => {
    const transposed = transposeSong(song, "C");
    expect(chordsIn(transposed)).toEqual(["C", "F", "G", "Am"]);
  });
});
