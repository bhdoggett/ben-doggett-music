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
    const filler: ChartModel["items"] = Array.from({ length: 22 }, () => ({
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

  it("places copyright centered at the bottom of page 1", () => {
    const all = ops(
      model(
        [{ type: "line", segments: [{ chord: "C", lyrics: "hi" }] }],
        "© 2026 Ben Doggett"
      )
    );
    const c = byText(all, "© 2026 Ben Doggett")!;
    expect(c.font).toBe("copyright");
    expect(c.page).toBe(1);
    expect(c.y).toBe(LAYOUT.page.height - LAYOUT.page.margin);
  });

  it("keeps an entire section together when it fits in a column", () => {
    // Fill the first column almost completely, then add a short section
    const filler: ChartModel["items"] = Array.from({ length: 22 }, () => ({
      type: "line" as const,
      segments: [{ chord: "C", lyrics: "filler" }],
    }));
    const all = ops(
      model([
        ...filler,
        { type: "section", label: "Bridge" },
        { type: "line", segments: [{ chord: "F", lyrics: "bridge1" }] },
        { type: "line", segments: [{ chord: "G", lyrics: "bridge2" }] },
      ])
    );
    const section = byText(all, "BRIDGE")!;
    const last = byText(all, "bridge2")!;
    expect(section.page).toBe(last.page);
    expect(section.x).toBe(last.x);
  });
});

describe("keyless lyrics-only sheets", () => {
  const measure = (text: string) => text.length * 6;

  it("omits the Key line when the model has no key", () => {
    const all = layoutChart(
      {
        title: "Lyrics Only",
        key: "",
        items: [
          { type: "line", segments: [{ chord: "", lyrics: "Just words" }] },
        ],
      },
      measure
    );
    expect(all.find((op) => op.text.startsWith("Key:"))).toBeUndefined();
    expect(all.find((op) => op.text === "Just words")).toBeDefined();
  });
});

describe("two-column layout", () => {
  const measure = (text: string) => text.length * 6;

  it("flows content into a second column before breaking the page", () => {
    const lines: ChartModel["items"] = Array.from({ length: 40 }, () => ({
      type: "line" as const,
      segments: [{ chord: "C", lyrics: "line of text" }],
    }));
    const single = layoutChart(model(lines), measure, false);
    const two = layoutChart(model(lines), measure, true);

    const singleMaxPage = Math.max(...single.map((o) => o.page));
    const twoMaxPage = Math.max(...two.map((o) => o.page));

    // Two-column should use fewer (or equal) pages
    expect(twoMaxPage).toBeLessThanOrEqual(singleMaxPage);

    // Some content should be in the right column (x > left column width)
    const contentWidth = LAYOUT.page.width - 2 * LAYOUT.page.margin;
    const columnWidth = (contentWidth - LAYOUT.columnGap) / 2;
    const rightColStart = LAYOUT.page.margin + columnWidth + LAYOUT.columnGap;
    const rightColOps = two.filter((o) => o.x >= rightColStart);
    expect(rightColOps.length).toBeGreaterThan(0);
  });

  it("keeps title and key at full page width", () => {
    const all = layoutChart(
      model([{ type: "line", segments: [{ chord: "C", lyrics: "hi" }] }]),
      measure,
      true
    );
    expect(byText(all, "Test Song")!.x).toBe(LAYOUT.page.margin);
    expect(byText(all, "Key: C")!.x).toBe(LAYOUT.page.margin);
  });

  it("moves an entire section to the next column when it doesn't fit", () => {
    // Fill left column almost completely, then a short section
    const filler: ChartModel["items"] = Array.from({ length: 22 }, () => ({
      type: "line" as const,
      segments: [{ chord: "C", lyrics: "filler" }],
    }));
    const all = layoutChart(
      model([
        ...filler,
        { type: "section", label: "Bridge" },
        { type: "line", segments: [{ chord: "F", lyrics: "b1" }] },
        { type: "line", segments: [{ chord: "G", lyrics: "b2" }] },
      ]),
      measure,
      true
    );
    const section = byText(all, "BRIDGE")!;
    const last = byText(all, "b2")!;
    // Section header and all lines should be in the same column
    expect(section.x).toBe(last.x);
    expect(section.page).toBe(last.page);
    // The section should NOT be in the left column (it was moved)
    const contentWidth = LAYOUT.page.width - 2 * LAYOUT.page.margin;
    const columnWidth = (contentWidth - LAYOUT.columnGap) / 2;
    const rightColStart = LAYOUT.page.margin + columnWidth + LAYOUT.columnGap;
    expect(section.x).toBeGreaterThanOrEqual(rightColStart);
  });
});
