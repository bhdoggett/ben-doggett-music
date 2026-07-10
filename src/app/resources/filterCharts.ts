import { ChartEntry } from "@/types";

export function filterCharts(
  entries: ChartEntry[],
  query: string
): ChartEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((entry) => entry.songTitle.toLowerCase().includes(q));
}
