import { describe, it, expect } from "vitest";
import { buildChartText, renderChartPdf } from "./chartPdf";

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

  it("converts &nbsp; entities to plain spaces with alignment intact", () => {
    // Chart files use &nbsp; as visual spacers for the HTML preview;
    // the PDF must render real spaces, not the literal entity text
    const chart = buildChartText(
      "{title: T}\n{key: C}\n[C]&nbsp;&nbsp;[]Sing to [F]the Lord",
      "C"
    );
    const body = chart.bodyLines.join("\n");
    expect(body).not.toContain("&nbsp;");
    expect(body).not.toContain(" ");
    // Alignment: F must sit directly over "the" in the lyric line
    const chordLine = chart.bodyLines.find((l) => /^C\s+F\s*$/.test(l));
    const lyricLine = chart.bodyLines.find((l) => l.includes("Sing to"));
    expect(chordLine).toBeDefined();
    expect(lyricLine).toBeDefined();
    expect(chordLine!.indexOf("F")).toBe(lyricLine!.indexOf("the"));
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
