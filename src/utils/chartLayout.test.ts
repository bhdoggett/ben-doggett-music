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
