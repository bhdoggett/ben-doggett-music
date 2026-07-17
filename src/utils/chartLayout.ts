import { ChartModel, ChartSegment } from "./chartModel";

export type FontRole =
  | "title"
  | "meta"
  | "section"
  | "chord"
  | "lyric"
  | "comment"
  | "copyright";

export interface DrawOp {
  page: number;
  x: number;
  y: number;
  text: string;
  font: FontRole;
  kind?: "text" | "line";
  x2?: number;
}

export type Measure = (text: string, font: FontRole) => number;

export const LAYOUT = {
  page: { width: 612, height: 792, margin: 54 },
  size: {
    title: 18,
    meta: 10,
    section: 10.5,
    chord: 10,
    lyric: 11,
    comment: 11,
    copyright: 7.5,
  },
  chordLyricGap: 12,
  lineSpacing: 6,
  sectionSpaceBefore: 10,
  blankHeight: 8,
  chordGap: 10,
  titleBlockGap: 26,
  copyrightGap: 24,
  columnGap: 36,
};

const BOTTOM = LAYOUT.page.height - LAYOUT.page.margin;
const CONTENT_WIDTH = LAYOUT.page.width - 2 * LAYOUT.page.margin;
const PAIR_HEIGHT =
  LAYOUT.chordLyricGap + LAYOUT.size.lyric + LAYOUT.lineSpacing;
const LINE_HEIGHT = LAYOUT.size.lyric + LAYOUT.lineSpacing;

export function layoutChart(
  model: ChartModel,
  measure: Measure,
  twoColumn = false
): DrawOp[] {
  const ops: DrawOp[] = [];
  let page = 1;
  let y = LAYOUT.page.margin + LAYOUT.size.title;

  const columnWidth = twoColumn
    ? (CONTENT_WIDTH - LAYOUT.columnGap) / 2
    : CONTENT_WIDTH;
  let columnX = LAYOUT.page.margin;
  let columnTop = y;

  const breakPage = () => {
    page += 1;
    columnTop = LAYOUT.page.margin + LAYOUT.size.chord;
    y = columnTop;
    columnX = LAYOUT.page.margin;
  };

  const ensure = (height: number) => {
    if (y + height > BOTTOM) {
      if (twoColumn && columnX === LAYOUT.page.margin) {
        columnX = LAYOUT.page.margin + columnWidth + LAYOUT.columnGap;
        y = columnTop;
        if (y + height > BOTTOM) breakPage();
      } else {
        breakPage();
      }
    }
  };

  // Title block
  ops.push({ page, x: LAYOUT.page.margin, y, text: model.title, font: "title" });
  if (model.key || model.tempo) {
    y += LAYOUT.size.meta + LAYOUT.lineSpacing * 1.5;
    const metaParts: string[] = [];
    if (model.key) metaParts.push(`Key: ${model.key}`);
    if (model.tempo) metaParts.push(`${model.tempo} bpm`);
    ops.push({
      page,
      x: LAYOUT.page.margin,
      y,
      text: metaParts.join("  ·  "),
      font: "meta",
    });
  }
  y += LAYOUT.titleBlockGap;
  columnTop = y;

  const lineOps = (segments: ChartSegment[], chordY: number, lyricY: number) => {
    let chordCursor = columnX;
    let lyricCursor = columnX;
    const out: DrawOp[] = [];
    for (const seg of segments) {
      const x = Math.max(chordCursor, lyricCursor);
      if (seg.chord) {
        out.push({ page, x, y: chordY, text: seg.chord, font: "chord" });
        chordCursor = x + measure(seg.chord, "chord") + LAYOUT.chordGap;
      }
      const lyricFont: FontRole = seg.isComment ? "comment" : "lyric";
      if (seg.lyrics !== "") {
        if (seg.lyrics.trim() !== "") {
          out.push({ page, x, y: lyricY, text: seg.lyrics, font: lyricFont });
        }
        lyricCursor = x + measure(seg.lyrics, lyricFont);
      }
    }
    return out;
  };

  // Measure the total height of a section: its header plus all following
  // lines/blanks up to (but not including) the next section.
  const sectionHeight = (startIndex: number): number => {
    let height =
      LAYOUT.sectionSpaceBefore + LAYOUT.size.section + LAYOUT.lineSpacing;
    for (let j = startIndex + 1; j < model.items.length; j++) {
      const item = model.items[j];
      if (item.type === "section") break;
      if (item.type === "blank") {
        height += LAYOUT.blankHeight;
      } else {
        const hasChords = item.segments.some((s) => s.chord !== "");
        height += hasChords ? PAIR_HEIGHT : LINE_HEIGHT;
      }
    }
    return height;
  };

  for (let i = 0; i < model.items.length; i++) {
    const item = model.items[i];

    if (item.type === "blank") {
      y += LAYOUT.blankHeight;
      continue;
    }

    if (item.type === "section") {
      const secHeight = sectionHeight(i);
      const fullColumnHeight = BOTTOM - columnTop;
      if (secHeight > BOTTOM - y && secHeight <= fullColumnHeight) {
        // Whole section fits in a fresh column — move it
        ensure(secHeight);
      } else {
        // Section fits here, or is too tall for any column — at least
        // keep the header with its first line
        ensure(LAYOUT.sectionSpaceBefore + LAYOUT.size.section + PAIR_HEIGHT);
      }
      y += LAYOUT.sectionSpaceBefore + LAYOUT.size.section;
      ops.push({
        page,
        x: columnX,
        y,
        text: item.label.toUpperCase(),
        font: "section",
      });
      y += LAYOUT.lineSpacing;
      continue;
    }

    const hasChords = item.segments.some((s) => s.chord !== "");
    if (hasChords) {
      ensure(PAIR_HEIGHT);
      const chordY = y + LAYOUT.size.chord;
      const lyricY = chordY + LAYOUT.chordLyricGap;
      ops.push(...lineOps(item.segments, chordY, lyricY));
      y = lyricY + LAYOUT.lineSpacing;
    } else {
      ensure(LINE_HEIGHT);
      const lyricY = y + LAYOUT.size.lyric;
      ops.push(...lineOps(item.segments, lyricY, lyricY));
      y = lyricY + LAYOUT.lineSpacing;
    }
  }

  if (model.copyright) {
    const lineY = BOTTOM - LAYOUT.copyrightGap;
    ops.push({
      page: 1,
      x: LAYOUT.page.margin,
      y: lineY,
      x2: LAYOUT.page.width - LAYOUT.page.margin,
      text: "",
      font: "copyright",
      kind: "line",
    });
    const copyrightWidth = measure(model.copyright, "copyright");
    ops.push({
      page: 1,
      x: (LAYOUT.page.width - copyrightWidth) / 2,
      y: BOTTOM,
      text: model.copyright,
      font: "copyright",
    });
  }

  return ops;
}
