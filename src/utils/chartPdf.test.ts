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

describe("chartPdfFilename", () => {
  it("appends the key when present, omits it when empty", async () => {
    const { chartPdfFilename } = await import("./chartPdf");
    expect(
      chartPdfFilename({ title: "T", key: "Eb", items: [] }, "my-song")
    ).toBe("my-song-Eb.pdf");
    expect(
      chartPdfFilename({ title: "T", key: "", items: [] }, "my-song")
    ).toBe("my-song.pdf");
  });
});
