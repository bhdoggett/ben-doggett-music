import { describe, it, expect } from "vitest";
import { buildChartModel, ChartItem } from "./chartModel";

const CHART = [
  "{title: Test Song}",
  "{key: C}",
  "{tempo: 120}",
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

  it("carries title, key, tempo, copyright", () => {
    expect(model.title).toBe("Test Song");
    expect(model.key).toBe("C");
    expect(model.tempo).toBe("120");
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
      expect(s.lyrics).not.toContain(" ");
      expect(s.lyrics).toBe("");
    }
  });

  it("normalizes literal U+00A0 characters, not just &nbsp; entities", () => {
    // U+00A0 embedded inside real lyric content (not whitespace-only,
    // so .trim() alone won't erase it) must become a plain space, not
    // be silently dropped by the chord-pro parser's word splitting.
    const chart = [
      "{title: NBSP Test}",
      "{key: C}",
      "[C]Sing to [F]the Lord",
    ].join("\n");
    const t = buildChartModel(chart, "C");
    const segs = line(t.items[0])!;
    const lyrics = segs.map((s) => s.lyrics).join("");
    expect(lyrics).not.toContain(" ");
    expect(lyrics).toBe("Sing to the Lord");
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
