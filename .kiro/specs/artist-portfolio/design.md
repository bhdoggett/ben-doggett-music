# Design Document

## Overview

The artist portfolio website is built on Next.js 16 with React 19, utilizing the App Router architecture. The system provides a modern organic interface for browsing and playing musical works, with responsive design and interactive audio capabilities powered by Tone.js.

The application follows a component-based architecture with CSS modules for styling, creating a cohesive visual experience that emphasizes the artistic nature of the content while maintaining excellent usability across devices.

## Architecture

### Application Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with global styles
│   ├── page.tsx                # Home/Releases page
│   ├── globals.css             # Global CSS variables and base styles
│   └── releases/
│       └── [slug]/
│           ├── page.tsx        # Dynamic release pages with CSS Grid layout
│           └── page.module.css # Grid layout styles
├── components/
│   ├── ReleaseCard/
│   │   ├── ReleaseCard.tsx       # Reusable release card component
│   │   └── ReleaseCard.module.css
│   ├── AudioPlayer/
│   │   ├── AudioPlayer.tsx     # Audio player component
│   │   └── AudioPlayer.module.css
│   ├── TracksList/
│   │   ├── TracksList.tsx      # Simplified track list for EPs
│   │   └── TracksList.module.css
│   ├── LyricsDisplay/
│   │   ├── LyricsDisplay.tsx   # Lyrics display component
│   │   └── LyricsDisplay.module.css
│   └── Layout/
│       ├── Navigation.tsx      # Site navigation
│       └── Navigation.module.css
├── contexts/
│   └── AudioContext.tsx        # Global audio state with selected song tracking
├── data/
│   └── releases.ts               # release metadata and configuration
├── types/
│   └── index.ts                # TypeScript type definitions
└── utils/
    └── audio.ts                # Audio utilities and helpers
```

### Technology Stack

- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19
- **Styling**: CSS Modules + Global CSS
- **Audio**: Tone.js for audio playback and analysis
- **TypeScript**: Full type safety
- **Assets**: Static files served from public/assets/

## Components and Interfaces

### Core Components

#### ReleaseCard Component

```typescript
interface ReleaseCardProps {
  release: release;
  onClick: () => void;
}
```

- Displays release cover art as primary visual element
- Handles click navigation to release pages
- Responsive design with hover effects
- Prioritizes JPG format for optimal web performance

#### AudioPlayer Component

```typescript
interface AudioPlayerProps {
  audioUrl: string;
  title: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}
```

- Powered by Tone.js for advanced audio capabilities
- Custom controls with organic design
- Progress tracking and seek functionality
- Maintains playback state across navigation

#### TracksList Component

```typescript
interface TracksListProps {
  songs: Song[];
  release: Release;
}
```

- Displays clickable list of song titles for EPs
- Updates global audio state when a song is clicked
- Visual indication of currently selected song
- No embedded lyrics or player (simplified component)

#### LyricsDisplay Component

```typescript
interface LyricsDisplayProps {
  selectedSong: Song | null;
}
```

- Displays lyrics and copyright for the currently selected song
- Reads selected song from global audio context
- Positioned below the release information in a full-width grid area
- Gracefully handles no selection state

### Data Models

#### release Interface

```typescript
interface release {
  id: string;
  title: string;
  type: "single" | "ep";
  coverArt: string; // JPG format for optimal web performance
  songs: Song[];
  description?: string;
}
```

#### Song Interface

```typescript
interface Song {
  id: string;
  title: string;
  audioUrl: string;
  lyrics?: string;
  copyright?: string;
  duration?: number;
}
```

## Data Models

### release Configuration

The system uses a centralized release configuration that maps to the existing asset structure:

```typescript
const releases: release[] = [
  {
    id: "deep-to-deep",
    title: "Deep to Deep",
    type: "ep",
    coverArt: "/assets/images/deep_to_deep.jpg",

    songs: [
      {
        id: "faithful-one",
        title: "Faithful One",
        audioUrl: "/assets/music/deep_to_deep/faithful_one.m4a",
      },
      // ... additional tracks
    ],
  },
  // ... additional releases
];
```

### Routing Strategy

- **Home Page** (`/`): Releases grid with all release cards
- **release Pages** (`/releases/[slug]`): Dynamic routing based on release ID
- **Static Generation**: Pre-render all release pages at build time

## Error Handling

### Audio Playback Errors

- Graceful fallback when Tone.js fails to load
- User-friendly error messages for unsupported audio formats
- Retry mechanisms for network-related audio loading issues

### Navigation Errors

- 404 handling for invalid release slugs
- Fallback to home page when release data is missing
- Loading states during navigation transitions

### Asset Loading

- Progressive image loading with blur placeholders
- Primary use of JPG format for release covers (optimal for photographic content)
- Lazy loading for audio files until user interaction

## Testing Strategy

### Component Testing

- Unit tests for ReleaseCard click handling and prop rendering
- AudioPlayer integration tests with mocked Tone.js
- SongList expand/collapse functionality testing

### Integration Testing

- End-to-end navigation flow from Releases to release pages
- Audio playback across different browsers and devices
- Responsive design testing across viewport sizes

### Performance Testing

- Audio loading and playback performance metrics
- Image optimization and loading speed analysis
- Bundle size optimization for Tone.js integration

## Page Layout Architecture

### EP Release Page Grid Layout

The EP release page uses CSS Grid to organize content into a clear, hierarchical structure:

```css
.releasePageGrid {
  display: grid;
  grid-template-columns: 400px 1fr;
  grid-template-rows: auto 1fr;
  gap: 2rem;
  grid-template-areas:
    "cover header"
    "lyrics lyrics";
}

.coverArea {
  grid-area: cover;
}
.headerArea {
  grid-area: header;
}
.lyricsArea {
  grid-area: lyrics;
}
```

**Layout Areas:**

- **Upper Left (cover)**: ReleaseCard component displaying album artwork
- **Upper Right (header)**: Release header information and TracksList component
- **Bottom Full Width (lyrics)**: LyricsDisplay component showing selected song lyrics

**Responsive Behavior:**

- Desktop (>1024px): Two-column grid as described above
- Tablet (768px-1024px): Narrower columns with adjusted spacing
- Mobile (<768px): Single column stack (cover → header → lyrics)

### Global Audio State Management

The AudioContext has been enhanced to track the currently selected song:

```typescript
interface GlobalAudioState {
  currentTrack: { song: Song; release: Release } | null;
  selectedSong: Song | null; // NEW: Tracks selected song for lyrics display
  isPlaying: boolean;
  // ... other state properties
}
```

**State Flow:**

1. User clicks a song in TracksList → Updates `selectedSong` in global state
2. LyricsDisplay component reads `selectedSong` from context
3. PlayButton can trigger audio playback independently
4. Both `selectedSong` and `currentTrack` can be different (selection vs playback)

## Visual Design System

### Color Palette (Modern Organic)

```css
:root {
  --primary-earth: #8b7355;
  --secondary-sage: #9caf88;
  --accent-terracotta: #c65d00;
  --neutral-cream: #f5f1eb;
  --neutral-charcoal: #2c2c2c;
  --surface-white: #ffffff;
  --surface-warm: #faf8f5;
}
```

### Typography

- Primary: Geist Sans (already configured)
- Monospace: Geist Mono for technical elements
- Organic spacing with natural rhythm

### Layout Principles

- Asymmetrical grid layouts with organic flow
- Generous whitespace and natural content breathing
- Curved corners and soft shadows
- Responsive breakpoints: 768px (tablet), 1024px (desktop)

### Interactive Elements

- Subtle hover animations with organic easing
- Focus states with natural color transitions
- Touch-friendly sizing for mobile devices
- Accessible contrast ratios throughout

## Performance Considerations

### Audio Optimization

- Lazy loading of Tone.js library until first audio interaction
- Audio file preloading for improved user experience
- Memory management for multiple audio instances

### Image Optimization

- Next.js Image component for automatic optimization
- WebP format support with fallbacks
- Responsive image sizing based on viewport

### Bundle Optimization

- Dynamic imports for Tone.js to reduce initial bundle size
- Tree shaking for unused CSS modules
- Code splitting at the release page level
