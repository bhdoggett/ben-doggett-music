import { describe, it, expect } from "vitest";
import sitemap from "./sitemap";
import { releases } from "@/data/releases";

describe("sitemap", () => {
  const urls = sitemap().map((entry) => entry.url);

  it("includes the resources page", () => {
    expect(urls).toContain("https://music.bendoggett.com/resources");
  });

  it("includes every release page", () => {
    for (const release of releases) {
      expect(urls).toContain(
        `https://music.bendoggett.com/releases/${release.id}`
      );
    }
  });
});
