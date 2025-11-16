# Design Document

## Overview

The ChordDisplay system extends the existing artist portfolio website with interactive chord sheet functionality. Built on the chordsheetjs library, it provides musicians with professional chord sheet rendering, key transposition, and a performance-optimized focus mode. The system integrates seamlessly with the existing release page architecture, allowing users to toggle between lyrics-only and chord sheet views.

The implementation follows the established component-based architecture with CSS modules, maintaining visual consistency with the modern organic design while adding musician-specific features.

## Architecture

### Application Structure

```
src/
├── components/
│   ├── ChordDisplay/
│   │   ├── ChordDisplay.tsx           # Main chord display component
│   │   ├── ChordDisplay.module.css    # Component styles
│   │   └── index.ts                   # Export barrel
│   ├── ViewToggle/
│   │   ├── ViewToggle.tsx             # Toggle between lyrics/chords
│   │   ├── ViewToggle.module.css      # Toggle button styles
│   │   └── index.ts                   # Export barrel
│   └── LyricsDisplay/                 # Existing component (no changes)
├── types/
│   └── index.ts                       # Extended with chordProUrl
└── data/
    └── releases.ts                     # Updated with chordProUrl references

public/
└── assets/
    └── chordpro/
        ├── example-song.txt           # Test ChordPro file
        └── [additional .txt files]    # Future chord sheets
```

### Technology Stack

- **Existing Stack**: Next.js 16, React 19, TypeScript, CSS Modules
- **New Dependencies**:
  - `chordsheetjs` (^8.0.0): ChordPro parsing and rendering
  - No additional dependencies required

### Integration Points

1. **Release Page**: Hosts ViewToggle and conditionally renders ChordDisplay or LyricsDisplay
2. **Song Data Model**: Extended with optional `chordProUrl` property
3. **Global Audio Player**: Remains visible and functional in focus mode
4. **AudioContext**: No changes required (ChordDisplay reads selectedSong)

## Components and Interfaces

### ChordDisplay Component

```typescript
interface ChordDisplayProps {
  chordProUrl: string;
  releaseType?: "single" | "ep";
}

interface ChordDisplayState {
  chordSheet: ChordSheetJS.ChordSheet | null;
  isLoading: boolean;
  error: string | null;
  originalKey: string; // Key from ChordPro file metadata
  selectedKey: string; // Currently displayed key (after transposition)
  isFocusMode: boolean;
}
```

**Responsibilities:**

- Fetch and parse ChordPro files using chordsheetjs
- Render chords above lyrics with proper alignment
- Provide key transposition controls
- Manage focus mode state and styling
- Handle loading and error states
- Export chord sheets as ChordPro .txt or PDF formats

**Key Features:**

- Uses `ChordProParser` from chordsheetjs to parse .txt files
- Uses `HtmlTableFormatter` or `HtmlDivFormatter` for rendering
- Implements transposition via chordsheetjs `transpose()` method
- Displays song metadata (title, artist, key) from ChordPro directives
- Stores `originalKey` from ChordPro metadata to enable reset functionality
- Tracks `selectedKey` separately to show current transposition state

### ViewToggle Component

```typescript
interface ViewToggleProps {
  currentView: "lyrics" | "chords";
  onViewChange: (view: "lyrics" | "chords") => void;
  hasChords: boolean;
}
```

**Responsibilities:**

- Render toggle buttons for lyrics/chords views
- Indicate current active view
- Only render when chord sheets are available
- Maintain accessible button states

**Design:**

- Segmented control style (iOS-inspired)
- Positioned above the lyrics/chords display area
- Smooth transition animations between states
- Disabled state when no chords available

### Focus Mode Overlay

**Implementation Approach:**

- Portal-based rendering to escape normal layout constraints
- Fixed positioning covering entire viewport
- Z-index above all content except global audio player
- Black background with high-contrast white text
- Larger font sizes for readability
- Exit button in top-right corner
- Scroll support for long chord sheets

**Layout Structure:**

```css
.focusMode {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999; /* Below global audio player at 1000 */
  background: #000;
  color: #fff;
  overflow-y: auto;
  padding: 2rem;
}
```

## Data Models

### Extended Song Interface

```typescript
interface Song {
  id: string;
  title: string;
  audioUrl: string;
  lyrics?: string;
  copyright?: string;
  duration?: number;
  chordProUrl?: string; // NEW: Path to ChordPro file
}
```

### ChordPro File Format

Standard ChordPro syntax stored in `.txt` files:

```
{title: Example Song}
{artist: Ben Doggett}
{key: G}

{start_of_verse}
[G]Amazing grace how [C]sweet the [G]sound
That [Em]saved a [C]wretch like [D]me
{end_of_verse}

{start_of_chorus}
[G]I once was [C]lost but [G]now am found
Was [Em]blind but [C]now I [D]see
{end_of_chorus}
```

**Supported Directives:**

- `{title}`, `{artist}`, `{key}`: Metadata
- `{start_of_verse}`, `{end_of_verse}`: Section markers
- `{start_of_chorus}`, `{end_of_chorus}`: Chorus sections
- `[chord]`: Chord annotations

## Component Behavior

### ChordDisplay Rendering Flow

1. **Mount**: Component receives `chordProUrl` prop
2. **Fetch**: Load ChordPro file from public assets
3. **Parse**: Use `ChordProParser` to create ChordSheet object
4. **Render**: Format using `HtmlTableFormatter` or custom renderer
5. **Display**: Inject formatted HTML into component
6. **Transpose**: Re-render on key change using `transpose()` method

### Key Transposition Logic

```typescript
// Using chordsheetjs built-in transposition
const transposedSheet = chordSheet.transpose(semitones);

// Calculate semitones from original key to target key
const calculateSemitones = (fromKey: string, toKey: string): number => {
  const keys = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const fromIndex = keys.indexOf(fromKey);
  const toIndex = keys.indexOf(toKey);
  return (toIndex - fromIndex + 12) % 12;
};
```

### View Toggle State Management

**State Location**: Release page component (local state)

```typescript
const [currentView, setCurrentView] = useState<"lyrics" | "chords">("lyrics");
const hasChords = selectedSong?.chordProUrl !== undefined;
```

**Rendering Logic:**

```typescript
{hasChords && (
  <ViewToggle
    currentView={currentView}
    onViewChange={setCurrentView}
    hasChords={hasChords}
  />
)}

{currentView === "lyrics" ? (
  <LyricsDisplay releaseType={release.type} />
) : (
  <ChordDisplay
    chordProUrl={selectedSong.chordProUrl!}
    releaseType={release.type}
  />
)}
```

## Error Handling

### ChordPro File Loading

- **404 Errors**: Display user-friendly message "Chord sheet not available"
- **Parse Errors**: Catch chordsheetjs exceptions and show "Invalid chord format"
- **Network Errors**: Retry mechanism with exponential backoff
- **Fallback**: Option to view lyrics if chords fail to load

### Transposition Edge Cases

- **Invalid Keys**: Validate key selection before transposition
- **Complex Chords**: Rely on chordsheetjs to handle extended chords (7th, 9th, sus, etc.)
- **Capo Notation**: Support ChordPro `{capo}` directive if present

### Focus Mode

- **Escape Key**: Exit focus mode on ESC key press
- **Audio Player Interaction**: Ensure z-index allows audio player to remain clickable
- **Scroll Position**: Preserve scroll position when entering/exiting focus mode

## Styling and Design

### Visual Design Integration

**Color Palette (Focus Mode):**

```css
:root {
  --focus-bg: #000000;
  --focus-text: #ffffff;
  --focus-chord: #ffd700; /* Gold for chord emphasis */
  --focus-section: #888888; /* Gray for section labels */
}
```

**Typography:**

- Chords: Monospace font (Geist Mono) for alignment
- Lyrics: Sans-serif font (Geist Sans) for readability
- Focus Mode: Larger base font size (1.25rem → 1.5rem)

### Responsive Behavior

**Desktop (>1024px):**

- ChordDisplay in lyrics area (full width)
- Transposition controls in header
- Focus mode: 60% width centered

**Tablet (768px-1024px):**

- Reduced padding and margins
- Transposition dropdown instead of button grid

**Mobile (<768px):**

- Single column layout
- Compact transposition control
- Focus mode: 90% width with minimal padding

### Accessibility

- **Keyboard Navigation**: Tab through transposition keys, focus mode toggle
- **Screen Readers**: Announce chord changes and key transposition
- **Focus Indicators**: Clear visual focus states on all interactive elements
- **ARIA Labels**: Descriptive labels for all controls

## Performance Considerations

### ChordPro File Loading

- **Lazy Loading**: Only fetch ChordPro files when chord view is selected
- **Caching**: Store parsed ChordSheet objects in component state
- **File Size**: Keep ChordPro files under 50KB for fast loading

### Rendering Optimization

- **Memoization**: Use `useMemo` for transposed chord sheets
- **Virtual Scrolling**: Consider for very long chord sheets (>500 lines)
- **HTML Injection**: Sanitize chordsheetjs output to prevent XSS

### Bundle Size

- **chordsheetjs**: ~50KB gzipped (acceptable addition)
- **Code Splitting**: Dynamic import ChordDisplay component
- **Tree Shaking**: Import only required chordsheetjs modules

## Testing Strategy

### Component Testing

- **ChordDisplay**: Parse sample ChordPro file, verify rendering
- **ViewToggle**: Test state changes and button interactions
- **Transposition**: Verify correct semitone calculations
- **Focus Mode**: Test enter/exit behavior and styling

### Integration Testing

- **Release Page**: Toggle between lyrics and chords views
- **Audio Playback**: Ensure audio continues in focus mode
- **Responsive Design**: Test across viewport sizes

### ChordPro File Validation

- **Syntax Validation**: Test with valid and invalid ChordPro files
- **Edge Cases**: Empty files, files without chords, malformed directives
- **Character Encoding**: UTF-8 support for special characters

## Implementation Phases

### Phase 1: Core ChordDisplay Component

- Install chordsheetjs dependency
- Create ChordDisplay component with basic rendering
- Implement ChordPro file fetching and parsing
- Add loading and error states

### Phase 2: Transposition Feature

- Add key selection UI
- Implement transposition logic using chordsheetjs
- Display current key and transposed key
- Handle edge cases and validation

### Phase 3: View Toggle Integration

- Create ViewToggle component
- Update release page to manage view state
- Implement conditional rendering of lyrics/chords
- Add session persistence for view preference

### Phase 4: Focus Mode

- Implement focus mode overlay with portal
- Add enter/exit controls
- Style for performance readability
- Ensure global audio player remains accessible

### Phase 5: Assets and Testing

- Create ChordPro directory structure
- Add example ChordPro file
- Update Song data model with chordProUrl
- Write component tests
- Test responsive behavior

## Example ChordPro File

**File**: `public/assets/chordpro/example-song.txt`

```
{title: Faithful One}
{artist: Ben Doggett}
{key: G}
{capo: 0}

{start_of_verse}
[G]Faithful One, we will [C]hope in your un[G]failing love
From the [Em]rising to the [C]setting [D]sun
We will [G]hope in [C]Jesus' [G]name
You have [Em]never [C]failed [D]us
{end_of_verse}

{start_of_chorus}
[G]Rich in compassion, [C]lavish in love
[Em]Hope of the nations, [D]beautiful God
[G]Full of new mercy [C]day after day
You [Em]come to save me, [D]Lamb who was slain
{end_of_chorus}

{start_of_bridge}
And for e[G]ternity we'll [C]sing this song:
Our [Em]God is love, Our [D]God is love
The [G]One who was and [C]is and is to come
Our [Em]God is love, Our [D]God is love
{end_of_bridge}
```

## Migration Path

### Existing Songs

- No breaking changes to existing functionality
- Songs without `chordProUrl` continue to show lyrics only
- ViewToggle only appears when chords are available

### Adding Chords to Songs

1. Create ChordPro .txt file in `public/assets/chordpro/`
2. Add `chordProUrl` property to Song in `releases.ts`
3. ChordDisplay automatically becomes available

### Download Functionality

**ChordPro Export:**

- Generate transposed ChordPro text from current chord sheet
- Use browser download API to save as .txt file
- Filename format: `{song-title}-{key}.txt`

**PDF Export:**

- Use library like `jsPDF` or browser print API
- Render formatted chord sheet to PDF
- Include song metadata in header
- Filename format: `{song-title}-{key}.pdf`

**Implementation:**

```typescript
const downloadChordPro = () => {
  const transposedText = generateChordProText(chordSheet, selectedKey);
  const blob = new Blob([transposedText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${songTitle}-${selectedKey}.txt`;
  a.click();
};

const downloadPDF = () => {
  // Use browser print API or jsPDF
  window.print(); // Simple approach
  // OR use jsPDF for more control
};
```

### Future Enhancements

- Auto-scroll synchronized with audio playback
- User-created chord annotations
- Chord diagram tooltips for guitar players
- Batch export of multiple songs
