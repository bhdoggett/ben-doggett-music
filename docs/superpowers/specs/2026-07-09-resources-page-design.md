# Resources Page — Design

Date: 2026-07-09
Status: Approved

## Purpose

A dedicated page where worship leaders and musicians can browse every song
that has a chord chart, preview the chart in any key, and download it as a
PDF. The page opens with a usage note making clear the songs are free to
use.

## Route & Navigation

- Route: `/resources`, nav label **Resources** (added to `NavBar` after
  "Story").
- Added to `sitemap.ts`.
- Page metadata: title "Resources", description covering free chord charts
  for worship.

## Page Layout

Top of page:

1. **Usage note** (exact copy):
   > No license required, but I'd love to hear from you if you're singing
   > any of my songs at your church. Reach out at
   > bendoggettsongs@gmail.com
   The email is a `mailto:` link.
2. **Filter input**, top center — filters song titles, case-insensitive
   substring. Release groups with no matching songs hide.

Below, a master-detail split:

- **Left pane** — scrollable song list in release order, grouped under
  small release headers. Only songs with a `chordProUrl` appear (Speak to
  Me, Hope of Glory, and O My Soul are excluded). Clicking a title selects
  the song.
- **Right pane** — chart display for the selected song:
  - Key dropdown, defaulting to the chart's original key, using the same
    major/minor key lists as the release pages. Changing it re-renders the
    chart live.
  - **Download PDF** button.
  - Chart rendered with chordsheetjs `HtmlTableFormatter`, styled like the
    release-page chart display.
  - The first song (release order) is selected by default so the pane is
    never empty.

**Mobile** (single column): panes stack — list on top, chart below.
Tapping a title scrolls the chart into view.

## Data Flow

`src/app/resources/page.tsx` is a server component. At build time it reads
every referenced chordpro file from `public/assets/chordpro/` with `fs`,
parses each to extract the original key, and passes an array of

```ts
{
  songId, songTitle, releaseId, releaseTitle,
  chordProText, originalKey, copyright
}
```

to a `ResourcesList` client component. No client-side fetching; total
embedded chart text is ~35KB. Missing or unparseable chart files fail the
build (already guarded by the data test suite).

## PDF Generation

Two layers in `src/utils/chartPdf.ts`:

1. `buildChartText(chordProText, targetKey)` — pure logic: parse, transpose
   via the existing `transposeSong` (correct flat/sharp spelling), format
   with chordsheetjs `TextFormatter` (chords-over-lyrics monospace), return
   header (title, key), body lines, and copyright footer. Unit-tested (TDD).
2. A thin jsPDF wrapper that lays the lines onto US Letter pages in
   Courier with automatic page breaks and triggers a download named
   `<song-id>-<key>.pdf` (e.g. `psalm-23-shepherd-me-Eb.pdf`).

jsPDF is a new dependency, dynamically imported on first download click so
it is never loaded for visitors who don't download.

## Shared Utilities

- The major/minor key lists currently defined inline in
  `ChordDisplay.tsx` move to `src/utils/chords.ts`; both ChordDisplay and
  the resources page import them.

## Error Handling

- Build-time: missing/broken chordpro files fail `next build` and the data
  tests.
- Runtime: if the dynamic jsPDF import or PDF generation fails, show a
  small inline error message near the download button. No dialogs.

## Testing

- TDD on `buildChartText`: chords-over-words output, transposed spelling
  (flat key → flat chords), header contains title and key, footer contains
  copyright.
- Existing data tests already guarantee every referenced chart parses and
  declares a key.
- Sitemap entry for `/resources` covered alongside existing routes.

## Out of Scope

- Charts for the three songs without chordpro files.
- Multi-song/batch PDF export.
- Any server-side PDF generation.
