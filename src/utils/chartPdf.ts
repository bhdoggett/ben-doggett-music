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
