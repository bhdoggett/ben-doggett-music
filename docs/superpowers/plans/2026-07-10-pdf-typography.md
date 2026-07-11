# Typographic PDF Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the monospace Courier PDF charts with measured typographic layout — Source Serif lyrics, bold Source Sans chords and section headers, italic inline comments.

**Architecture:** `buildChartModel` parses/transposes chordpro into a serializable model (sections / segment lines / blanks). Pure `layoutChart(model, measure)` converts the model into positioned draw-ops with page breaks and keep-together rules, testable with a fake measurer. `renderChartPdf` embeds fonts, supplies real jsPDF measurement, and draws the ops. `buildChartText`/`ChartText`/TextFormatter are deleted.

**Tech Stack:** chordsheetjs 12 (ChordProParser, Tag, ChordLyricsPair), jsPDF (dynamic import + addFileToVFS/addFont), Vitest.

## Global Constraints

- Design agreed in conversation 2026-07-10 (no separate spec doc): lyrics Source Serif 4 regular; chords + section headers + title Source Sans 3 bold; inline comments Source Serif italic.
- Fonts and jsPDF load ONLY at download time (dynamic import); nothing static in the page module graph.
- `&nbsp;` and U+00A0 in chart sources become plain spaces before parsing (behavior from commit 8233e1b, must be preserved).
- Transposition decision identical to the preview path: gate on `calculateSemitones(originalKey, targetKey) !== 0`, transpose via `transposeSong` (both from `src/utils/chords`).
- PDF filename stays `${songId}-${key}.pdf`.
- Run tests with `rtk proxy npx vitest run <file>` (plain vitest output is filtered and hides failures).
- All commits end with: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

### Task 1: Embedded font assets

**Files:**
- Create: `src/utils/pdfFonts.ts` (generated, base64 font data)

**Interfaces:**
- Produces:

```ts
export const SOURCE_SERIF_REGULAR: string; // base64 TTF
export const SOURCE_SERIF_ITALIC: string;  // base64 TTF
export const SOURCE_SANS_BOLD: string;     // base64 TTF
```

- [ ] **Step 1: Download the TTFs** (Adobe's official release branches):

```bash
cd /tmp && \
curl -sLO https://github.com/adobe-fonts/source-serif/raw/release/TTF/SourceSerif4-Regular.ttf && \
curl -sLO https://github.com/adobe-fonts/source-serif/raw/release/TTF/SourceSerif4-It.ttf && \
curl -sLO https://github.com/adobe-fonts/source-sans/raw/release/TTF/SourceSans3-Bold.ttf && \
ls -la SourceSerif4-Regular.ttf SourceSerif4-It.ttf SourceSans3-Bold.ttf
```

Each file must be >100KB and start with a TTF magic number. Verify: `file Source*.ttf` reports TrueType (or `xxd -l4` shows `0001 0000`). If a URL 404s, check the repo's release branch layout with the GitHub API before improvising; do not substitute different fonts.

- [ ] **Step 2: Generate the module**:

```bash
node -e "
const fs = require('fs');
const b64 = (f) => fs.readFileSync('/tmp/' + f).toString('base64');
const out = '// Generated file - base64-encoded TTFs for PDF embedding.\n' +
  '// Source Serif 4 & Source Sans 3, SIL OFL 1.1 (Adobe Fonts).\n' +
  '// Regenerate per docs/superpowers/plans/2026-07-10-pdf-typography.md Task 1.\n\n' +
  'export const SOURCE_SERIF_REGULAR = ' + JSON.stringify(b64('SourceSerif4-Regular.ttf')) + ';\n\n' +
  'export const SOURCE_SERIF_ITALIC = ' + JSON.stringify(b64('SourceSerif4-It.ttf')) + ';\n\n' +
  'export const SOURCE_SANS_BOLD = ' + JSON.stringify(b64('SourceSans3-Bold.ttf')) + ';\n';
fs.writeFileSync('src/utils/pdfFonts.ts', out);
console.log('wrote', fs.statSync('src/utils/pdfFonts.ts').size, 'bytes');
"
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit` clean; quick decode sanity:

```bash
node -e "
const m = require('fs').readFileSync('src/utils/pdfFonts.ts','utf8');
const match = m.match(/SOURCE_SERIF_REGULAR = \"([^\"]+)\"/);
const buf = Buffer.from(match[1], 'base64');
console.log('serif regular bytes:', buf.length, 'magic ok:', buf.readUInt32BE(0) === 0x00010000);
"
```

Expected: bytes >100000, magic ok: true.

- [ ] **Step 4: Commit** — `git add src/utils/pdfFonts.ts && git commit` message: `Add embedded Source Serif/Sans font data for PDFs`

### Task 2: `buildChartModel`

**Files:**
- Create: `src/utils/chartModel.ts`
- Test: `src/utils/chartModel.test.ts`

**Interfaces:**
- Consumes: `calculateSemitones`, `transposeSong` from `./chords`; `ChordProParser`, `Tag`, `ChordLyricsPair` from `chordsheetjs`
- Produces:

```ts
export interface ChartSegment {
  chord: string;   // "" when none
  lyrics: string;  // "" when none
  isComment?: boolean; // inline {comment:} rendered italic
}
export type ChartItem =
  | { type: "section"; label: string }
  | { type: "line"; segments: ChartSegment[] }
  | { type: "blank" };
export interface ChartModel {
  title: string;
  key: string;
  items: ChartItem[];
  copyright?: string;
}
export function buildChartModel(
  chordProText: string,
  targetKey: string,
  copyright?: string
): ChartModel;
```

Rules: standalone comment tag (only meaningful item in its line) → section; inline comment tag → `{chord:"", lyrics: value, isComment: true}` segment; metadata tags (title/key/artist/time/tempo/capo/anything else) produce nothing; empty lines → blank, but never two consecutive blanks, none leading/trailing.

- [ ] **Step 1: Write the failing test** — `src/utils/chartModel.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildChartModel, ChartItem } from "./chartModel";

const CHART = [
  "{title: Test Song}",
  "{key: C}",
  "",
  "{comment: Verse 1}",
  "The [C]LORD is My [F]Shepherd {comment: (repeat)}",
  "",
  "",
  "{comment: Intro}",
  "[|]&nbsp;&nbsp;[C]&nbsp;&nbsp;[|]",
].join("\n");

const line = (item: ChartItem) =>
  item.type === "line" ? item.segments : null;

describe("buildChartModel", () => {
  const model = buildChartModel(CHART, "C", "© Ben Doggett");

  it("carries title, key, copyright", () => {
    expect(model.title).toBe("Test Song");
    expect(model.key).toBe("C");
    expect(model.copyright).toBe("© Ben Doggett");
  });

  it("turns standalone comments into sections and keeps order", () => {
    const kinds = model.items.map((i) =>
      i.type === "section" ? `section:${i.label}` : i.type
    );
    expect(kinds).toEqual([
      "section:Verse 1",
      "line",
      "blank",
      "section:Intro",
      "line",
    ]);
  });

  it("splits chord/lyric pairs into segments", () => {
    const segs = line(model.items[1])!;
    expect(segs[0]).toEqual({ chord: "", lyrics: "The " });
    expect(segs[1]).toEqual({ chord: "C", lyrics: "LORD " });
    expect(segs[3]).toEqual({ chord: "F", lyrics: "Shepherd " });
  });

  it("marks inline comments as italic comment segments", () => {
    const segs = line(model.items[1])!;
    expect(segs[segs.length - 1]).toEqual({
      chord: "",
      lyrics: "(repeat)",
      isComment: true,
    });
  });

  it("converts &nbsp; to spaces in chord-only lines", () => {
    const segs = line(model.items[4])!;
    expect(segs.map((s) => s.chord)).toEqual(["|", "C", "|"]);
    for (const s of segs) {
      expect(s.lyrics).not.toContain("&nbsp;");
      expect(s.lyrics).not.toContain(" ");
    }
  });

  it("transposes chords with the target key's spelling", () => {
    const t = buildChartModel(CHART, "Db");
    const segs = line(t.items[1])!;
    expect(segs[1].chord).toBe("Db");
    expect(segs[3].chord).toBe("Gb");
  });

  it("never emits leading, trailing, or doubled blanks", () => {
    const kinds = model.items.map((i) => i.type);
    expect(kinds[0]).not.toBe("blank");
    expect(kinds[kinds.length - 1]).not.toBe("blank");
    kinds.forEach((k, idx) => {
      if (k === "blank") expect(kinds[idx + 1]).not.toBe("blank");
    });
  });
});
```

- [ ] **Step 2: Run** `rtk proxy npx vitest run src/utils/chartModel.test.ts` — FAIL (module missing).

- [ ] **Step 3: Implement** — `src/utils/chartModel.ts`:

```ts
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
        const lyrics = item.lyrics ?? "";
        if (chord || lyrics.trim()) {
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

  return { title, key: targetKey, items, copyright };
}
```

- [ ] **Step 4: Run** — all chartModel tests PASS. Note: if the pair-splitting test fails on exact segment boundaries, print the actual parsed segments and adjust EXPECTATIONS only if chordsheetjs genuinely splits differently than the test assumes (e.g. `"is My "` as its own chordless pair between C and F) — the test above matches verified parser output: `[{"",The },{C,LORD },{"",is My },{F,Shepherd }]`, so index 1 is `LORD ` and index 3 is `Shepherd `.

- [ ] **Step 5: Commit** — message: `Add structured chart model for PDF layout`

### Task 3: `layoutChart` (pure layout engine)

**Files:**
- Create: `src/utils/chartLayout.ts`
- Test: `src/utils/chartLayout.test.ts`

**Interfaces:**
- Consumes: `ChartModel`, `ChartItem`, `ChartSegment` from `./chartModel`
- Produces:

```ts
export type FontRole = "title" | "meta" | "section" | "chord" | "lyric" | "comment" | "copyright";
export interface DrawOp {
  page: number;   // 1-based
  x: number;      // pt from left
  y: number;      // pt baseline from top
  text: string;
  font: FontRole;
}
export type Measure = (text: string, font: FontRole) => number; // width in pt
export function layoutChart(model: ChartModel, measure: Measure): DrawOp[];

// exported for the renderer and tests:
export const LAYOUT = {
  page: { width: 612, height: 792, margin: 54 },
  size: { title: 18, meta: 10, section: 10.5, chord: 10, lyric: 11, comment: 11, copyright: 7.5 },
  chordLyricGap: 12,   // baseline distance chord -> lyric within a pair
  lineSpacing: 6,      // extra space after each line/pair
  sectionSpaceBefore: 10,
  blankHeight: 8,
  chordGap: 10,        // min horizontal gap between consecutive chords
  titleBlockGap: 26,   // after title+key block
  copyrightGap: 24,
};
```

Layout rules:
- Title at top of page 1 (`title` font), then `Key: <key>` (`meta` font) one meta-line below, then `titleBlockGap`.
- Section item: advance `sectionSpaceBefore`, then the label UPPERCASED in `section` font. Keep-together: if the section header plus one following line-pair (two line heights) would cross the bottom, page-break BEFORE the header.
- Line item: if any segment has a chord → a pair: chord baseline at y, lyric baseline at y + `chordLyricGap`; consumes `chordLyricGap + lyric height + lineSpacing`. If no chords → single lyric line. A pair never splits across pages.
- Segment x-positioning: `x = max(chordCursor, lyricCursor)`; draw chord (if any) at x on the chord baseline, lyrics (if non-empty) at x on the lyric baseline; then `if chord: chordCursor = x + measure(chord, "chord") + chordGap`; `if lyrics: lyricCursor = x + measure(lyrics, "lyric"|"comment")`. Comment segments use `comment` font and render on the LYRIC baseline.
- Blank item: advance `blankHeight`.
- Copyright: after the last item, `copyrightGap` below (page-break if needed), `copyright` font.
- Line height per baseline advance: use the font size (pt) of the dominant role + `lineSpacing` where stated; concretely: pair = `chordLyricGap` + `size.lyric` + `lineSpacing`; lyric-only line = `size.lyric + lineSpacing`; chord-only pair still uses full pair height (chords with empty lyrics are common intro lines — chord baseline + empty lyric row keeps vertical rhythm).
- Bottom boundary: `page.height - page.margin`; content starts at `page.margin + size.title` on page 1 (title baseline) and `page.margin + size.chord` on subsequent pages.

- [ ] **Step 1: Write the failing test** — `src/utils/chartLayout.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { layoutChart, LAYOUT, DrawOp } from "./chartLayout";
import { ChartModel } from "./chartModel";

// Fake measurer: every char is 6pt wide regardless of font
const measure = (text: string) => text.length * 6;

const model = (items: ChartModel["items"], copyright?: string): ChartModel => ({
  title: "Test Song",
  key: "C",
  items,
  copyright,
});

const ops = (m: ChartModel) => layoutChart(m, measure);
const byText = (all: DrawOp[], text: string) =>
  all.find((op) => op.text === text);

describe("layoutChart", () => {
  it("places title, key, and uppercased section headers", () => {
    const all = ops(
      model([
        { type: "section", label: "Verse 1" },
        { type: "line", segments: [{ chord: "C", lyrics: "Sing" }] },
      ])
    );
    expect(byText(all, "Test Song")?.font).toBe("title");
    expect(byText(all, "Key: C")?.font).toBe("meta");
    const section = byText(all, "VERSE 1")!;
    expect(section.font).toBe("section");
    expect(section.page).toBe(1);
  });

  it("puts each chord directly above its lyric segment", () => {
    const all = ops(
      model([
        {
          type: "line",
          segments: [
            { chord: "", lyrics: "The " },     // 24pt wide
            { chord: "C", lyrics: "LORD " },
            { chord: "F", lyrics: "Shepherd" },
          ],
        },
      ])
    );
    const c = byText(all, "C")!;
    const lord = byText(all, "LORD ")!;
    expect(c.x).toBe(lord.x);
    expect(lord.y - c.y).toBe(LAYOUT.chordLyricGap);
    // F starts where "LORD " ends: x("The ") + width("LORD ") = 24 + 30
    expect(byText(all, "F")!.x).toBe(LAYOUT.page.margin + 24 + 30);
  });

  it("pushes lyrics right when a chord is wider than its lyrics", () => {
    const all = ops(
      model([
        {
          type: "line",
          segments: [
            { chord: "Gmaj7sus4", lyrics: "a " }, // chord 54pt, lyrics 12pt
            { chord: "C", lyrics: "song" },
          ],
        },
      ])
    );
    // second segment starts after chord cursor: 54 + chordGap
    expect(byText(all, "C")!.x).toBe(
      LAYOUT.page.margin + 54 + LAYOUT.chordGap
    );
  });

  it("spaces chord-only lines by chord width plus gap", () => {
    const all = ops(
      model([
        {
          type: "line",
          segments: [
            { chord: "|", lyrics: "  " },
            { chord: "C", lyrics: "  " },
            { chord: "|", lyrics: "" },
          ],
        },
      ])
    );
    const first = byText(all, "|")!;
    const c = byText(all, "C")!;
    expect(c.x).toBeGreaterThanOrEqual(
      first.x + measure("|") + LAYOUT.chordGap
    );
  });

  it("renders comment segments in comment font on the lyric baseline", () => {
    const all = ops(
      model([
        {
          type: "line",
          segments: [
            { chord: "C", lyrics: "end" },
            { chord: "", lyrics: "(repeat)", isComment: true },
          ],
        },
      ])
    );
    const comment = byText(all, "(repeat)")!;
    const lyric = byText(all, "end")!;
    expect(comment.font).toBe("comment");
    expect(comment.y).toBe(lyric.y);
  });

  it("breaks pages and never splits a chord/lyric pair", () => {
    const lines: ChartModel["items"] = Array.from({ length: 40 }, () => ({
      type: "line" as const,
      segments: [{ chord: "C", lyrics: "line of text" }],
    }));
    const all = ops(model(lines));
    expect(Math.max(...all.map((o) => o.page))).toBeGreaterThan(1);
    // every chord op has its lyric op on the same page
    const chords = all.filter((o) => o.font === "chord");
    for (const c of chords) {
      const lyric = all.find(
        (o) => o.font === "lyric" && o.x === c.x && o.y === c.y + LAYOUT.chordLyricGap
      );
      expect(lyric?.page).toBe(c.page);
    }
    // nothing below the bottom margin
    for (const o of all) {
      expect(o.y).toBeLessThanOrEqual(LAYOUT.page.height - LAYOUT.page.margin);
    }
  });

  it("keeps a section header with the following line", () => {
    // Fill page 1 almost exactly, then a section + line
    const filler: ChartModel["items"] = Array.from({ length: 23 }, () => ({
      type: "line" as const,
      segments: [{ chord: "C", lyrics: "filler" }],
    }));
    const all = ops(
      model([
        ...filler,
        { type: "section", label: "Bridge" },
        { type: "line", segments: [{ chord: "F", lyrics: "last" }] },
      ])
    );
    const section = byText(all, "BRIDGE")!;
    const following = byText(all, "last")!;
    expect(section.page).toBe(following.page);
  });

  it("appends copyright after content, breaking pages when needed", () => {
    const all = ops(
      model(
        [{ type: "line", segments: [{ chord: "C", lyrics: "hi" }] }],
        "© 2026 Ben Doggett"
      )
    );
    const c = byText(all, "© 2026 Ben Doggett")!;
    expect(c.font).toBe("copyright");
  });
});
```

- [ ] **Step 2: Run** `rtk proxy npx vitest run src/utils/chartLayout.test.ts` — FAIL (module missing).

- [ ] **Step 3: Implement** — `src/utils/chartLayout.ts`:

```ts
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
```

- [ ] **Step 4: Run** — all layout tests PASS. The keep-together test's filler count (23) assumes PAIR_HEIGHT=29 and page 1 content start; if it doesn't force the intended boundary, adjust the FILLER COUNT (not the production logic) so the section header lands within one pair-height of the bottom, and verify the assertion still exercises the keep-together branch (temporarily disable `ensure` in the section case and confirm the test then fails).

- [ ] **Step 5: Commit** — message: `Add pure measured layout engine for PDF charts`

### Task 4: Renderer rewrite + old path removal

**Files:**
- Modify: `src/utils/chartPdf.ts` (full rewrite)
- Modify: `src/utils/chartPdf.test.ts` (full rewrite)
- Modify: `src/app/resources/ResourcesBrowser.tsx` (imports + handleDownload)

**Interfaces:**
- Consumes: `buildChartModel`/`ChartModel` (Task 2), `layoutChart`/`LAYOUT`/`FontRole` (Task 3), font constants (Task 1)
- Produces:

```ts
export async function renderChartPdf(model: ChartModel): Promise<import("jspdf").jsPDF>;
export async function downloadChartPdf(model: ChartModel, songId: string): Promise<void>;
// buildChartText and ChartText are DELETED
```

- [ ] **Step 1: Rewrite the test file** — `src/utils/chartPdf.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildChartModel } from "./chartModel";
import { renderChartPdf } from "./chartPdf";

const CHART =
  "{title: Test Song}\n{key: C}\n{comment: Verse 1}\n[C]Sing [F]to [G]the [Am]Lord";

describe("renderChartPdf", () => {
  it("produces a PDF with embedded fonts", async () => {
    const model = buildChartModel(CHART, "Db", "© 2026 Ben Doggett");
    const doc = await renderChartPdf(model);
    expect(doc.output().startsWith("%PDF")).toBe(true);
    const fonts = doc.getFontList();
    expect(fonts).toHaveProperty("SourceSerif4");
    expect(fonts).toHaveProperty("SourceSans3");
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it("breaks long charts onto multiple pages", async () => {
    const many = Array.from({ length: 80 }, () => "[C]line of song text")
      .join("\n");
    const model = buildChartModel(
      `{title: Long}\n{key: C}\n${many}`,
      "C"
    );
    const doc = await renderChartPdf(model);
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run** `rtk proxy npx vitest run src/utils/chartPdf.test.ts` — FAIL (old exports gone / new behavior missing).

- [ ] **Step 3: Rewrite** — `src/utils/chartPdf.ts` (replace entire file):

```ts
import { ChartModel } from "./chartModel";
import { layoutChart, LAYOUT, FontRole } from "./chartLayout";

interface FontSpec {
  family: string;
  style: "normal" | "italic" | "bold";
}

const FONT_FOR: Record<FontRole, FontSpec> = {
  title: { family: "SourceSans3", style: "bold" },
  meta: { family: "SourceSans3", style: "bold" },
  section: { family: "SourceSans3", style: "bold" },
  chord: { family: "SourceSans3", style: "bold" },
  lyric: { family: "SourceSerif4", style: "normal" },
  comment: { family: "SourceSerif4", style: "italic" },
  copyright: { family: "SourceSerif4", style: "normal" },
};

export async function renderChartPdf(model: ChartModel) {
  const [{ jsPDF }, fonts] = await Promise.all([
    import("jspdf"),
    import("./pdfFonts"),
  ]);

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  doc.addFileToVFS("SourceSerif4-Regular.ttf", fonts.SOURCE_SERIF_REGULAR);
  doc.addFont("SourceSerif4-Regular.ttf", "SourceSerif4", "normal");
  doc.addFileToVFS("SourceSerif4-It.ttf", fonts.SOURCE_SERIF_ITALIC);
  doc.addFont("SourceSerif4-It.ttf", "SourceSerif4", "italic");
  doc.addFileToVFS("SourceSans3-Bold.ttf", fonts.SOURCE_SANS_BOLD);
  doc.addFont("SourceSans3-Bold.ttf", "SourceSans3", "bold");

  const setFont = (role: FontRole) => {
    const spec = FONT_FOR[role];
    doc.setFont(spec.family, spec.style);
    doc.setFontSize(LAYOUT.size[role]);
  };

  const measure = (text: string, role: FontRole) => {
    setFont(role);
    return doc.getTextWidth(text);
  };

  const ops = layoutChart(model, measure);

  let currentPage = 1;
  for (const op of ops) {
    while (currentPage < op.page) {
      doc.addPage();
      currentPage += 1;
    }
    doc.setPage(op.page);
    setFont(op.font);
    doc.text(op.text, op.x, op.y);
  }

  return doc;
}

export async function downloadChartPdf(
  model: ChartModel,
  songId: string
): Promise<void> {
  const doc = await renderChartPdf(model);
  doc.save(`${songId}-${model.key}.pdf`);
}
```

- [ ] **Step 4: Update ResourcesBrowser** — in `src/app/resources/ResourcesBrowser.tsx`: replace the `buildChartText, downloadChartPdf` import with `import { downloadChartPdf } from "@/utils/chartPdf";` and `import { buildChartModel } from "@/utils/chartModel";`; in `handleDownload` replace the `buildChartText(...)` call with:

```ts
const model = buildChartModel(
  selected.chordProText,
  selectedKey || selected.originalKey,
  selected.copyright
);
await downloadChartPdf(model, selected.songId);
```

- [ ] **Step 5: Verify** — `rtk proxy npx vitest run` (full suite; the old buildChartText tests are gone, chartModel/chartLayout/chartPdf suites pass), `npx tsc --noEmit` clean, `npm run build` succeeds. Also `grep -rn "buildChartText\|ChartText" src/` → no hits.

- [ ] **Step 6: Commit** — message: `Render PDFs with measured typographic layout`

### Task 5: Sample PDFs + final verification

- [ ] **Step 1: Generate samples** for human review (node can run the renderer):

```bash
npx tsx -e "
import { readFileSync, writeFileSync } from 'fs';
import { buildChartModel } from './src/utils/chartModel';
import { renderChartPdf } from './src/utils/chartPdf';
const out = process.env.SCRATCH || '/tmp';
for (const [file, key, cr] of [
  ['psalm-23-shepherd-me', 'C', '© 2015 Ben Doggett'],
  ['psalm-23-shepherd-me', 'Eb', '© 2015 Ben Doggett'],
  ['glad', 'Ab', '© 2010 Ben Doggett'],
]) {
  const text = readFileSync('public/assets/chordpro/' + file + '.txt', 'utf8');
  const model = buildChartModel(text, key, cr);
  const doc = await renderChartPdf(model);
  const path = out + '/' + file + '-' + key + '.pdf';
  writeFileSync(path, Buffer.from(doc.output('arraybuffer')));
  console.log('wrote', path);
}
"
```

(If `tsx` is unavailable, `npm i -D tsx` first. Set SCRATCH to the session scratchpad directory.)

- [ ] **Step 2:** Full gate: `rtk proxy npx vitest run`, `npx tsc --noEmit`, `npx eslint src/utils src/app/resources`, `npm run build`.
- [ ] **Step 3:** Human eyeballs the sample PDFs (fonts embed correctly, chords over the right syllables, sections bold, intro bar lines spaced).
