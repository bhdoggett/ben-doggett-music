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
  // Chart files use &nbsp; (and occasionally the U+00A0 character) as
  // visual spacers for the HTML preview; the PDF needs real spaces.
  // Replace before parsing so TextFormatter computes column widths
  // from the actual rendered characters.
  const plainText = chordProText.replace(/&nbsp;| /g, " ");
  const parsed = new ChordProParser().parse(plainText);
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
    .filter(
      (line) => line.trim().toLowerCase() !== title.trim().toLowerCase()
    );

  // Trim leading/trailing blank lines
  while (bodyLines.length && bodyLines[0].trim() === "") bodyLines.shift();
  while (bodyLines.length && bodyLines[bodyLines.length - 1].trim() === "")
    bodyLines.pop();

  return { title, key: targetKey, bodyLines, copyright };
}

const PAGE = { width: 612, height: 792, margin: 54 }; // US Letter, pt
const LINE_HEIGHT = 12;
const BODY_FONT_SIZE = 9.5;

export async function renderChartPdf(chart: ChartText) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const bottom = PAGE.height - PAGE.margin;
  let y = PAGE.margin;

  doc.setFont("courier", "bold");
  doc.setFontSize(14);
  doc.text(chart.title, PAGE.margin, y);
  y += LINE_HEIGHT * 1.5;
  doc.setFontSize(10);
  doc.text(`Key: ${chart.key}`, PAGE.margin, y);
  y += LINE_HEIGHT * 2;

  doc.setFont("courier", "normal");
  doc.setFontSize(BODY_FONT_SIZE);
  for (const line of chart.bodyLines) {
    if (y > bottom) {
      doc.addPage();
      y = PAGE.margin;
    }
    doc.text(line, PAGE.margin, y);
    y += LINE_HEIGHT;
  }

  if (chart.copyright) {
    if (y + LINE_HEIGHT * 2 > bottom) {
      doc.addPage();
      y = PAGE.margin;
    }
    doc.setFontSize(8);
    doc.text(chart.copyright, PAGE.margin, y + LINE_HEIGHT * 2);
  }

  return doc;
}

export async function downloadChartPdf(
  chart: ChartText,
  songId: string
): Promise<void> {
  const doc = await renderChartPdf(chart);
  doc.save(`${songId}-${chart.key}.pdf`);
}
