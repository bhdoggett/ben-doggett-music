import { ChartModel } from "./chartModel";
import { layoutChart, LAYOUT, FontRole } from "./chartLayout";

interface FontSpec {
  family: string;
  style: "normal" | "italic" | "bold";
}

const FONT_FOR: Record<FontRole, FontSpec> = {
  title: { family: "Geist", style: "bold" },
  meta: { family: "Geist", style: "bold" },
  section: { family: "Geist", style: "bold" },
  chord: { family: "GeistMono", style: "normal" },
  lyric: { family: "Geist", style: "normal" },
  comment: { family: "Geist", style: "italic" },
  copyright: { family: "Geist", style: "italic" },
};

export async function renderChartPdf(model: ChartModel, twoColumn = false) {
  const [{ jsPDF }, fonts] = await Promise.all([
    import("jspdf"),
    import("./pdfFonts"),
  ]);

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  doc.addFileToVFS("Geist-Regular.ttf", fonts.GEIST_REGULAR);
  doc.addFont("Geist-Regular.ttf", "Geist", "normal");
  doc.addFileToVFS("Geist-Italic.ttf", fonts.GEIST_ITALIC);
  doc.addFont("Geist-Italic.ttf", "Geist", "italic");
  doc.addFileToVFS("Geist-Bold.ttf", fonts.GEIST_BOLD);
  doc.addFont("Geist-Bold.ttf", "Geist", "bold");
  doc.addFileToVFS("GeistMono-SemiBold.ttf", fonts.GEIST_MONO_SEMIBOLD);
  doc.addFont("GeistMono-SemiBold.ttf", "GeistMono", "normal");

  const setFont = (role: FontRole) => {
    const spec = FONT_FOR[role];
    doc.setFont(spec.family, spec.style);
    doc.setFontSize(LAYOUT.size[role]);
  };

  const measure = (text: string, role: FontRole) => {
    setFont(role);
    return doc.getTextWidth(text);
  };

  const ops = layoutChart(model, measure, twoColumn);

  let currentPage = 1;
  for (const op of ops) {
    while (currentPage < op.page) {
      doc.addPage();
      currentPage += 1;
    }
    doc.setPage(op.page);
    if (op.kind === "line") {
      setFont(op.font);
      doc.setLineWidth(0.5);
      doc.line(op.x, op.y, op.x2!, op.y);
      continue;
    }
    setFont(op.font);
    doc.text(op.text, op.x, op.y);
  }

  return doc;
}

export function chartPdfFilename(model: ChartModel, songId: string): string {
  return model.key ? `${songId}-${model.key}.pdf` : `${songId}.pdf`;
}

export async function downloadChartPdf(
  model: ChartModel,
  songId: string,
  twoColumn = false
): Promise<void> {
  const doc = await renderChartPdf(model, twoColumn);
  doc.save(chartPdfFilename(model, songId));
}
