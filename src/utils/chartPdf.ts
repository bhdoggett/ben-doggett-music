import { ChordProParser, TextFormatter } from "chordsheetjs";
import { calculateSemitones, transposeSong } from "./chords";

export interface ChartText {
  title: string;
  key: string;
  bodyLines: string[];
  copyright?: string;
}

export function buildChartText(
  chordProText: string,
  targetKey: string,
  copyright?: string
): ChartText {
  const parsed = new ChordProParser().parse(chordProText);
  const originalKey = String(parsed.metadata.key ?? "");
  const title = String(parsed.metadata.title ?? "Untitled");

  const song =
    originalKey && calculateSemitones(originalKey, targetKey) !== 0
      ? transposeSong(parsed, targetKey)
      : parsed;

  const bodyLines = new TextFormatter()
    .format(song)
    .split("\n")
    // TextFormatter prints the title as its own header line; the PDF
    // renders title separately, so drop it from the body
    .filter((line) => line.trim() !== title.trim());

  // Trim leading/trailing blank lines
  while (bodyLines.length && bodyLines[0].trim() === "") bodyLines.shift();
  while (bodyLines.length && bodyLines[bodyLines.length - 1].trim() === "")
    bodyLines.pop();

  return { title, key: targetKey, bodyLines, copyright };
}
