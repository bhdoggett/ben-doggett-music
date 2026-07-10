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

  it("filters the title even though TextFormatter uppercases it", () => {
    const chart = buildChartText(
      "{title: Amazing Grace}\n{key: C}\n[C]How sweet the sound",
      "C"
    );
    expect(chart.bodyLines.join("\n").toLowerCase()).not.toContain(
      "amazing grace"
    );
  });
});
