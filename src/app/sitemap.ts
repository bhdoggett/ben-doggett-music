import type { MetadataRoute } from "next";
import { releases } from "@/data/releases";

const BASE_URL = "https://music.bendoggett.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/releases`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/story`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    ...releases.map((release) => ({
      url: `${BASE_URL}/releases/${release.id}`,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
