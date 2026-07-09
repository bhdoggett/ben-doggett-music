import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { join } from "path";
import { releases } from "./releases";

const publicDir = join(__dirname, "../../public");

const allSongs = releases.flatMap((release) =>
  release.songs.map((song) => ({ release, song }))
);

describe("release data integrity", () => {
  it("has unique release ids", () => {
    const ids = releases.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has globally unique song ids (the audio player uses song.id as identity)", () => {
    const ids = allSongs.map(({ song }) => song.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  it("uses URL-safe release ids", () => {
    for (const release of releases) {
      expect(release.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  describe.each(releases)("release: $id", (release) => {
    it("cover art file exists", () => {
      expect(existsSync(join(publicDir, release.coverArt))).toBe(true);
    });

    it("streaming links point at real platform URLs", () => {
      const { bandcamp, spotify, appleMusic } = release.streamingLinks ?? {};
      if (bandcamp) {
        expect(bandcamp).toMatch(
          /^https:\/\/bendoggett\.bandcamp\.com\/(track|album)\/[a-z0-9-]+$/
        );
      }
      if (spotify) {
        // Real Spotify ids are 22 base-62 chars; placeholders like
        // /track/son-of-glory-john-1 must fail
        expect(spotify).toMatch(
          /^https:\/\/open\.spotify\.com\/(album|track)\/[A-Za-z0-9]{22}(\?.*)?$/
        );
      }
      if (appleMusic) {
        expect(appleMusic).toMatch(
          /^https:\/\/music\.apple\.com\/us\/(album|song)\/[a-z0-9-]+\/\d+$/
        );
      }
    });
  });

  describe.each(allSongs)("song: $song.id", ({ song }) => {
    it("audio file exists", () => {
      expect(existsSync(join(publicDir, song.audioUrl))).toBe(true);
    });

    it("chordpro file exists when referenced", () => {
      if (song.chordProUrl) {
        expect(existsSync(join(publicDir, song.chordProUrl))).toBe(true);
      }
    });

    it("lyrics contain no control characters besides newlines", () => {
      // Catches escape-sequence typos like \t eating a letter
      expect(song.lyrics).not.toMatch(/[\t\r\v\f\0]/);
    });

    it("has a copyright line", () => {
      expect(song.copyright, `${song.title} is missing copyright`).toBeTruthy();
    });
  });
});
