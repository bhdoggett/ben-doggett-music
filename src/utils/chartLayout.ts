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
};

const BOTTOM = LAYOUT.page.height - LAYOUT.page.margin;
const PAIR_HEIGHT =
  LAYOUT.chordLyricGap + LAYOUT.size.lyric + LAYOUT.lineSpacing;
const LINE_HEIGHT = LAYOUT.size.lyric + LAYOUT.lineSpacing;

export function layoutChart(model: ChartModel, measure: Measure): DrawOp[] {
  const ops: DrawOp[] = [];
  let page = 1;
  let y = LAYOUT.page.margin + LAYOUT.size.title;

  const breakPage = () => {
    page += 1;
    y = LAYOUT.page.margin + LAYOUT.size.chord;
  };

  const ensure = (height: number) => {
    if (y + height > BOTTOM) breakPage();
  };

  // Title block
  ops.push({ page, x: LAYOUT.page.margin, y, text: model.title, font: "title" });
  y += LAYOUT.size.meta + LAYOUT.lineSpacing * 1.5;
  ops.push({
    page,
    x: LAYOUT.page.margin,
    y,
    text: `Key: ${model.key}`,
    font: "meta",
  });
  y += LAYOUT.titleBlockGap;

  const lineOps = (segments: ChartSegment[], chordY: number, lyricY: number) => {
    let chordCursor = LAYOUT.page.margin;
    let lyricCursor = LAYOUT.page.margin;
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

  for (let i = 0; i < model.items.length; i++) {
    const item = model.items[i];

    if (item.type === "blank") {
      y += LAYOUT.blankHeight;
      continue;
    }

    if (item.type === "section") {
      // keep header together with one following pair
      ensure(LAYOUT.sectionSpaceBefore + LAYOUT.size.section + PAIR_HEIGHT);
      y += LAYOUT.sectionSpaceBefore + LAYOUT.size.section;
      ops.push({
        page,
        x: LAYOUT.page.margin,
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
    ensure(LAYOUT.copyrightGap + LAYOUT.size.copyright);
    y += LAYOUT.copyrightGap + LAYOUT.size.copyright;
    ops.push({
      page,
      x: LAYOUT.page.margin,
      y,
      text: model.copyright,
      font: "copyright",
    });
  }

  return ops;
}
