import { Song } from "chordsheetjs";

// Chromatic positions; minor keys share their root's position (Am = A = 9)
const KEY_POSITIONS: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

function keyPosition(key: string): number | undefined {
  const root = key.endsWith("m") ? key.slice(0, -1) : key;
  return KEY_POSITIONS[root];
}

export function calculateSemitones(fromKey: string, toKey: string): number {
  const from = keyPosition(fromKey);
  const to = keyPosition(toKey);

  if (from === undefined || to === undefined) {
    return 0;
  }

  return (to - from + 12) % 12;
}

// changeKey (rather than transpose-by-semitones) so chords take the
// target key's spelling: flat keys get flat chords, sharp keys sharps
export function transposeSong(song: Song, toKey: string): Song {
  return song.changeKey(toKey);
}
