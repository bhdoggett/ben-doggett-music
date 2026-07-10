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
      expect(s.lyrics).not.toContain(" ");
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
