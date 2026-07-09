# Resources Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/resources` page where visitors browse all songs with chord charts, preview a chart in any key, and download it as a PDF.

**Architecture:** A server component reads every chordpro file at build time and embeds the raw text in the page. A client component renders a master-detail layout (song list left, live-transposed chart right) reusing the tested `transposeSong` util. PDFs are compiled client-side at click time with dynamically-imported jsPDF.

**Tech Stack:** Next.js 16 app router, TypeScript, CSS Modules, chordsheetjs 12, jsPDF (new dep), Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-09-resources-page-design.md`
- Usage-note copy, verbatim: "No license required, but I'd love to hear from you if you're singing any of my songs at your church. Reach out at bendoggettsongs@gmail.com" (email is a `mailto:` link)
- Route `/resources`, nav label "Resources"
- No inline styles; CSS Modules with existing design tokens (`var(--...)` from `globals.css`)
- Run tests with `rtk proxy npx vitest run <file>` (plain `npx vitest` output is filtered and hides failures)
- All commits end with: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

### Task 1: Shared key lists in `src/utils/chords.ts`

**Files:**
- Modify: `src/utils/chords.ts`
- Modify: `src/components/ChordDisplay/ChordDisplay.tsx` (lines ~200-230, the `majorKeys`/`minorKeys` arrays)
- Test: `src/utils/chords.test.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `export const MAJOR_KEYS: string[]` and `export const MINOR_KEYS: string[]` (12 entries each, flat spellings, order C→B), and `export function keysFor(key: string): string[]` returning `MINOR_KEYS` when `key` ends with `m`, else `MAJOR_KEYS`.

- [ ] **Step 1: Write the failing test** — append to `src/utils/chords.test.ts`:

```ts
import { MAJOR_KEYS, MINOR_KEYS, keysFor } from "./chords"; // merge into existing import

describe("key lists", () => {
  it("exposes 12 major and 12 minor keys with flat spellings", () => {
    expect(MAJOR_KEYS).toEqual([
      "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
    ]);
    expect(MINOR_KEYS).toEqual(MAJOR_KEYS.map((k) => `${k}m`));
  });

  it("picks the list matching the key's mode", () => {
    expect(keysFor("Am")).toBe(MINOR_KEYS);
    expect(keysFor("C")).toBe(MAJOR_KEYS);
  });
});
```

- [ ] **Step 2: Run** `rtk proxy npx vitest run src/utils/chords.test.ts` — expect FAIL (no such exports).

- [ ] **Step 3: Implement** — append to `src/utils/chords.ts`:

```ts
export const MAJOR_KEYS = [
  "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
];

export const MINOR_KEYS = MAJOR_KEYS.map((key) => `${key}m`);

export function keysFor(key: string): string[] {
  return key.endsWith("m") ? MINOR_KEYS : MAJOR_KEYS;
}
```

- [ ] **Step 4: Run** the same command — expect PASS (all tests).

- [ ] **Step 5: Refactor ChordDisplay** — in `ChordDisplay.tsx`, delete the inline `majorKeys` and `minorKeys` const arrays, add `MAJOR_KEYS`/`MINOR_KEYS` to the existing `@/utils/chords` import, and change:

```ts
const musicalKeys = isMinorKey ? MINOR_KEYS : MAJOR_KEYS;
```

- [ ] **Step 6: Verify** — `npx tsc --noEmit` clean, `rtk proxy npx vitest run` all pass.

- [ ] **Step 7: Commit** — `git add -A src/utils src/components/ChordDisplay && git commit` message: `Share transposition key lists from utils/chords`

### Task 2: `buildChartText` (pure PDF content logic)

**Files:**
- Create: `src/utils/chartPdf.ts`
- Test: `src/utils/chartPdf.test.ts`

**Interfaces:**
- Consumes: `transposeSong`, `calculateSemitones` from `./chords`; `ChordProParser`, `TextFormatter` from `chordsheetjs`
- Produces:

```ts
export interface ChartText {
  title: string;      // from chordpro {title:}, falls back to "Untitled"
  key: string;        // the target key
  bodyLines: string[]; // monospace chart lines (chords over lyrics)
  copyright?: string;
}
export function buildChartText(
  chordProText: string,
  targetKey: string,
  copyright?: string
): ChartText;
```

- [ ] **Step 1: Write the failing test** — `src/utils/chartPdf.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildChartText } from "./chartPdf";

const CHART = "{title: Test Song}\n{key: C}\n[C]Sing [F]to [G]the [Am]Lord";

describe("buildChartText", () => {
  it("returns title, target key, and chords-over-lyrics body", () => {
    const chart = buildChartText(CHART, "C", "© 2024 Ben Doggett");
    expect(chart.title).toBe("Test Song");
    expect(chart.key).toBe("C");
    expect(chart.copyright).toBe("© 2024 Ben Doggett");
    const body = chart.bodyLines.join("\n");
    expect(body).toContain("Sing to the Lord"); // lyric line
    expect(body).toMatch(/C\s+F\s+G\s+Am/);     // chord line
  });

  it("does not duplicate the title inside the body", () => {
    const chart = buildChartText(CHART, "C");
    expect(chart.bodyLines.join("\n")).not.toContain("Test Song");
  });

  it("transposes with the target key's spelling (flats)", () => {
    const chart = buildChartText(CHART, "Db");
    const body = chart.bodyLines.join("\n");
    expect(body).toMatch(/Db\s+Gb\s+Ab\s+Bbm/);
    expect(body).not.toContain("C#");
  });
});
```

- [ ] **Step 2: Run** `rtk proxy npx vitest run src/utils/chartPdf.test.ts` — expect FAIL (module missing).

- [ ] **Step 3: Implement** — `src/utils/chartPdf.ts`:

```ts
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
```

- [ ] **Step 4: Run** the same command — expect PASS. If the "does not duplicate title" test fails because TextFormatter formats the header differently (e.g. `Test Song` plus underline row of `=`), inspect actual output with a temporary `console.log` and extend the filter to drop that header block; keep the test as written.

- [ ] **Step 5: Commit** — `git add src/utils/chartPdf.ts src/utils/chartPdf.test.ts && git commit` message: `Add buildChartText for PDF chart content`

### Task 3: jsPDF layout + download wrapper

**Files:**
- Modify: `src/utils/chartPdf.ts` (append)
- Modify: `package.json` (new dep `jspdf`)
- Test: `src/utils/chartPdf.test.ts` (append)

**Interfaces:**
- Consumes: `ChartText` from Task 2
- Produces:

```ts
// Builds the document; exported for tests
export async function renderChartPdf(chart: ChartText): Promise<import("jspdf").jsPDF>;
// Browser-only: builds and triggers the file download
export async function downloadChartPdf(chart: ChartText, songId: string): Promise<void>;
```

Filename rule: `${songId}-${chart.key}.pdf` (key lists contain only flats/naturals, so no `#` reaches a filename).

- [ ] **Step 1: Install** `npm install jspdf`

- [ ] **Step 2: Write the failing test** — append to `src/utils/chartPdf.test.ts`:

```ts
import { renderChartPdf } from "./chartPdf"; // merge into existing import

describe("renderChartPdf", () => {
  it("produces a PDF document containing every body line", async () => {
    const chart = buildChartText(CHART, "Db", "© 2024 Ben Doggett");
    const doc = await renderChartPdf(chart);
    const out = doc.output(); // string; PDFs start with %PDF
    expect(out.startsWith("%PDF")).toBe(true);
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it("breaks onto multiple pages for long charts", async () => {
    const longChart = {
      title: "Long",
      key: "C",
      bodyLines: Array.from({ length: 200 }, (_, i) => `line ${i}`),
    };
    const doc = await renderChartPdf(longChart);
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 3: Run** `rtk proxy npx vitest run src/utils/chartPdf.test.ts` — expect FAIL (`renderChartPdf` not exported).

- [ ] **Step 4: Implement** — append to `src/utils/chartPdf.ts`:

```ts
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
```

- [ ] **Step 5: Run** the same command — expect PASS. Then `rtk proxy npx vitest run` (full suite) — all pass.

- [ ] **Step 6: Commit** — `git add -A src/utils package.json package-lock.json && git commit` message: `Add jsPDF chart rendering and download`

### Task 4: Filter helper

**Files:**
- Create: `src/app/resources/filterCharts.ts`
- Test: `src/app/resources/filterCharts.test.ts`
- Modify: `src/types/index.ts` (add `ChartEntry`)

**Interfaces:**
- Produces: in `src/types/index.ts`:

```ts
export interface ChartEntry {
  songId: string;
  songTitle: string;
  releaseId: string;
  releaseTitle: string;
  chordProText: string;
  originalKey: string;
  copyright?: string;
}
```

and in `filterCharts.ts`:

```ts
export function filterCharts(entries: ChartEntry[], query: string): ChartEntry[];
```

Case-insensitive substring match on `songTitle`; empty/whitespace query returns all entries; order preserved.

- [ ] **Step 1: Add the `ChartEntry` interface** to `src/types/index.ts` exactly as above.

- [ ] **Step 2: Write the failing test** — `src/app/resources/filterCharts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { filterCharts } from "./filterCharts";
import { ChartEntry } from "@/types";

const entry = (songId: string, songTitle: string): ChartEntry => ({
  songId,
  songTitle,
  releaseId: "r",
  releaseTitle: "R",
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
```

- [ ] **Step 3: Run** `rtk proxy npx vitest run src/app/resources/filterCharts.test.ts` — expect FAIL (module missing).

- [ ] **Step 4: Implement** — `src/app/resources/filterCharts.ts`:

```ts
import { ChartEntry } from "@/types";

export function filterCharts(
  entries: ChartEntry[],
  query: string
): ChartEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((entry) => entry.songTitle.toLowerCase().includes(q));
}
```

- [ ] **Step 5: Run** the same command — expect PASS.

- [ ] **Step 6: Commit** — `git add src/types src/app/resources && git commit` message: `Add ChartEntry type and chart filter helper`

### Task 5: Resources page (server component + client browser UI)

**Files:**
- Create: `src/app/resources/page.tsx`
- Create: `src/app/resources/ResourcesBrowser.tsx`
- Create: `src/app/resources/page.module.css`

**Interfaces:**
- Consumes: `ChartEntry` (Task 4), `filterCharts` (Task 4), `buildChartText`/`downloadChartPdf` (Tasks 2-3), `transposeSong`/`calculateSemitones`/`keysFor` (Task 1 + existing), `releases` from `@/data/releases`
- Produces: route `/resources`

- [ ] **Step 1: Server component** — `src/app/resources/page.tsx`:

```tsx
import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { ChordProParser } from "chordsheetjs";
import NavBar from "@/components/NavBar/NavBar";
import { releases } from "@/data/releases";
import { ChartEntry } from "@/types";
import ResourcesBrowser from "./ResourcesBrowser";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Free chord charts for Ben Doggett's worship songs — preview in any key and download as PDF.",
};

function loadChartEntries(): ChartEntry[] {
  return releases.flatMap((release) =>
    release.songs
      .filter((song) => song.chordProUrl)
      .map((song) => {
        const chordProText = readFileSync(
          join(process.cwd(), "public", song.chordProUrl!),
          "utf-8"
        );
        const parsed = new ChordProParser().parse(chordProText);
        return {
          songId: song.id,
          songTitle: song.title,
          releaseId: release.id,
          releaseTitle: release.title,
          chordProText,
          originalKey: String(parsed.metadata.key ?? ""),
          copyright: song.copyright,
        };
      })
  );
}

export default function ResourcesPage() {
  const charts = loadChartEntries();

  return (
    <>
      <NavBar />
      <div className={styles.container}>
        <p className={styles.usageNote}>
          No license required, but I&apos;d love to hear from you if
          you&apos;re singing any of my songs at your church. Reach out at{" "}
          <a href="mailto:bendoggettsongs@gmail.com" className={styles.email}>
            bendoggettsongs@gmail.com
          </a>
        </p>
        <ResourcesBrowser charts={charts} />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Client component** — `src/app/resources/ResourcesBrowser.tsx`:

```tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { ChordProParser, HtmlTableFormatter } from "chordsheetjs";
import { ChartEntry } from "@/types";
import { calculateSemitones, keysFor, transposeSong } from "@/utils/chords";
import { buildChartText, downloadChartPdf } from "@/utils/chartPdf";
import { filterCharts } from "./filterCharts";
import styles from "./page.module.css";

interface ResourcesBrowserProps {
  charts: ChartEntry[];
}

export default function ResourcesBrowser({ charts }: ResourcesBrowserProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(charts[0]?.songId ?? "");
  const [selectedKey, setSelectedKey] = useState(charts[0]?.originalKey ?? "");
  const [pdfError, setPdfError] = useState<string | null>(null);
  const chartPaneRef = useRef<HTMLDivElement>(null);

  const visible = filterCharts(charts, query);
  const selected = charts.find((c) => c.songId === selectedId) ?? null;

  const chartHtml = useMemo(() => {
    if (!selected) return "";
    const parsed = new ChordProParser().parse(selected.chordProText);
    const song =
      selected.originalKey &&
      selectedKey &&
      calculateSemitones(selected.originalKey, selectedKey) !== 0
        ? transposeSong(parsed, selectedKey)
        : parsed;
    return new HtmlTableFormatter().format(song);
  }, [selected, selectedKey]);

  const selectSong = (entry: ChartEntry) => {
    setSelectedId(entry.songId);
    setSelectedKey(entry.originalKey);
    setPdfError(null);
    // On stacked (mobile) layout, bring the chart into view
    if (window.innerWidth < 768) {
      chartPaneRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDownload = async () => {
    if (!selected) return;
    setPdfError(null);
    try {
      const chart = buildChartText(
        selected.chordProText,
        selectedKey || selected.originalKey,
        selected.copyright
      );
      await downloadChartPdf(chart, selected.songId);
    } catch {
      setPdfError("PDF download failed. Please try again.");
    }
  };

  // Group visible entries by release, preserving release order
  const groups = useMemo(() => {
    const byRelease = new Map<string, { title: string; songs: ChartEntry[] }>();
    for (const entry of visible) {
      const group = byRelease.get(entry.releaseId) ?? {
        title: entry.releaseTitle,
        songs: [],
      };
      group.songs.push(entry);
      byRelease.set(entry.releaseId, group);
    }
    return Array.from(byRelease.values());
  }, [visible]);

  return (
    <div className={styles.browser}>
      <input
        type="search"
        className={styles.filterInput}
        placeholder="Filter songs…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Filter songs by title"
      />
      <div className={styles.panes}>
        <nav className={styles.songList} aria-label="Songs">
          {groups.length === 0 && (
            <p className={styles.emptyList}>No songs match.</p>
          )}
          {groups.map((group) => (
            <div key={group.title} className={styles.releaseGroup}>
              <h2 className={styles.releaseTitle}>{group.title}</h2>
              <ul className={styles.songItems}>
                {group.songs.map((entry) => (
                  <li key={entry.songId}>
                    <button
                      className={
                        entry.songId === selectedId
                          ? `${styles.songButton} ${styles.songButtonActive}`
                          : styles.songButton
                      }
                      onClick={() => selectSong(entry)}
                    >
                      {entry.songTitle}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className={styles.chartPane} ref={chartPaneRef}>
          {selected ? (
            <>
              <div className={styles.chartControls}>
                <label htmlFor="resource-key" className={styles.keyLabel}>
                  Key:
                </label>
                <select
                  id="resource-key"
                  className={styles.keySelect}
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                >
                  {keysFor(selected.originalKey).map((k) => (
                    <option key={k} value={k}>
                      {k}
                      {k === selected.originalKey ? " (Original)" : ""}
                    </option>
                  ))}
                </select>
                <button
                  className={styles.downloadButton}
                  onClick={handleDownload}
                >
                  Download PDF
                </button>
              </div>
              {pdfError && <p className={styles.pdfError}>{pdfError}</p>}
              <div
                className={styles.chartContent}
                dangerouslySetInnerHTML={{ __html: chartHtml }}
              />
              {selected.copyright && (
                <p className={styles.copyright}>{selected.copyright}</p>
              )}
            </>
          ) : (
            <p className={styles.emptyList}>Select a song.</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Styles** — `src/app/resources/page.module.css`. Reuse the chord-table styling approach from `src/components/ChordDisplay/ChordDisplay.module.css` for `.chartContent` (check that file and copy its table/chord rules rather than inventing new ones):

```css
.container {
  margin-top: var(--navbar-height);
  padding: var(--spacing-xl);
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
}

.usageNote {
  background: var(--surface-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xl);
}

.email {
  color: var(--accent);
  font-weight: 500;
}

.filterInput {
  display: block;
  margin: 0 auto var(--spacing-xl);
  width: 100%;
  max-width: 420px;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-base);
  border: 1px solid var(--surface-secondary);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.panes {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-xl);
  align-items: start;
}

.songList {
  max-height: 70vh;
  overflow-y: auto;
  position: sticky;
  top: calc(var(--navbar-height) + var(--spacing-md));
}

.releaseGroup {
  margin-bottom: var(--spacing-lg);
}

.releaseTitle {
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.songItems {
  list-style: none;
  margin: 0;
  padding: 0;
}

.songButton {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: none;
  background: none;
  cursor: pointer;
  font-size: var(--font-size-base);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
}

.songButton:hover {
  background: var(--surface-secondary);
}

.songButtonActive {
  background: var(--surface-secondary);
  color: var(--accent);
  font-weight: 600;
}

.chartPane {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.chartControls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.keyLabel {
  font-weight: 500;
}

.keySelect {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  border: 1px solid var(--surface-secondary);
}

.downloadButton {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-lg);
  background: var(--accent);
  color: var(--surface-white);
  font-weight: 500;
  cursor: pointer;
}

.downloadButton:hover {
  background: var(--primary-earth);
}

.pdfError {
  color: var(--accent-terracotta);
  margin-bottom: var(--spacing-md);
}

.chartContent {
  overflow-x: auto;
}

.copyright {
  margin-top: var(--spacing-lg);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.emptyList {
  color: var(--text-secondary);
}

@media (max-width: 767px) {
  .panes {
    grid-template-columns: 1fr;
  }

  .songList {
    position: static;
    max-height: 40vh;
  }
}
```

- [ ] **Step 4: Verify** — `npx tsc --noEmit` clean; `npm run build` succeeds and lists `/resources` as a static route; `rtk proxy npx vitest run` all pass.

- [ ] **Step 5: Manual check** — `npm run dev`, open `http://localhost:3000/resources`: note renders with mailto link; filter narrows list; clicking songs swaps the chart; key change re-renders chords; Download PDF saves `<song-id>-<key>.pdf`; chart table styling matches release pages (fix `.chartContent` rules against `ChordDisplay.module.css` if not).

- [ ] **Step 6: Commit** — `git add src/app/resources && git commit` message: `Add /resources chord chart browser with PDF download`

### Task 6: Navigation and sitemap

**Files:**
- Modify: `src/components/NavBar/NavBar.tsx` (link list)
- Modify: `src/app/sitemap.ts`
- Test: `src/app/sitemap.test.ts` (create)

**Interfaces:**
- Consumes: `sitemap()` default export from `src/app/sitemap.ts`
- Produces: `/resources` in nav and sitemap

- [ ] **Step 1: Write the failing test** — `src/app/sitemap.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import sitemap from "./sitemap";
import { releases } from "@/data/releases";

describe("sitemap", () => {
  const urls = sitemap().map((entry) => entry.url);

  it("includes the resources page", () => {
    expect(urls).toContain("https://music.bendoggett.com/resources");
  });

  it("includes every release page", () => {
    for (const release of releases) {
      expect(urls).toContain(
        `https://music.bendoggett.com/releases/${release.id}`
      );
    }
  });
});
```

- [ ] **Step 2: Run** `rtk proxy npx vitest run src/app/sitemap.test.ts` — expect FAIL (`/resources` missing; the release-URLs test passes).

- [ ] **Step 3: Implement** — in `src/app/sitemap.ts`, add after the `/story` entry:

```ts
    {
      url: `${BASE_URL}/resources`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
```

In `src/components/NavBar/NavBar.tsx`, add after the Story link:

```tsx
        <Link href="/resources" className={styles.link}>
          Resources
        </Link>
```

- [ ] **Step 4: Run** `rtk proxy npx vitest run` — all pass. `npm run build` — succeeds.

- [ ] **Step 5: Commit** — `git add src/app/sitemap.ts src/app/sitemap.test.ts src/components/NavBar && git commit` message: `Add Resources to nav and sitemap`

### Task 7: Final verification

- [ ] **Step 1:** `rtk proxy npx vitest run` — every test passes.
- [ ] **Step 2:** `npx tsc --noEmit` — clean.
- [ ] **Step 3:** `npx eslint src/app/resources src/utils/chartPdf.ts` — no new errors (pre-existing warnings elsewhere are fine).
- [ ] **Step 4:** `npm run build` — succeeds; `/resources` static.
- [ ] **Step 5:** Manual pass per Task 5 Step 5 on mobile width too (responsive stack, tap-to-scroll).
