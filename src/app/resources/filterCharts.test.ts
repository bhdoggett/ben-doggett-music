import { describe, it, expect } from "vitest";
import { filterCharts } from "./filterCharts";
import { ChartEntry } from "@/types";

const entry = (songId: string, songTitle: string): ChartEntry => ({
  songId,
  songTitle,
  releaseId: "r",
  releaseTitle: "R",
  releaseType: "ep",
  chordProText: "",
  originalKey: "C",
});

const entries = [
  entry("a", "Psalm 23 (Shepherd Me)"),
  entry("b", "Faithful One"),
  entry("c", "O The Father's Love"),
];

describe("filterCharts", () => {
  it("matches case-insensitive substrings of the title", () => {
    expect(filterCharts(entries, "psalm").map((e) => e.songId)).toEqual(["a"]);
    expect(filterCharts(entries, "FAith").map((e) => e.songId)).toEqual(["b"]);
  });

  it("returns everything for empty or whitespace queries", () => {
    expect(filterCharts(entries, "")).toEqual(entries);
    expect(filterCharts(entries, "   ")).toEqual(entries);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterCharts(entries, "zzz")).toEqual([]);
  });
});
