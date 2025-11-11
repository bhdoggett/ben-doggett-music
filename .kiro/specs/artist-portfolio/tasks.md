# Implementation Plan

- [x] 1. Set up project foundation and dependencies

  - Install Tone.js dependency for audio functionality
  - Update package.json with required audio libraries
  - Configure TypeScript types for Tone.js integration
  - _Requirements: 5.2, 5.3_

- [x] 2. Create core data models and release configuration

  - Define TypeScript interfaces for release and Song types
  - Create centralized release data configuration mapping to existing assets
  - Implement release data with all existing releases (Deep to Deep EP, Glad EP, and singles)
  - _Requirements: 1.2, 2.4, 7.2_

- [x] 3. Implement global styling and design system

  - Update globals.css with modern organic color palette and typography
  - Create CSS custom properties for consistent design tokens
  - Implement responsive breakpoints and base layout styles
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 4. Build ReleaseCard component

  - Create reusable ReleaseCard component with TypeScript props
  - Implement CSS module styling with organic design principles
  - Add hover effects and responsive behavior
  - Integrate Next.js Image component for optimized release cover display
  - _Requirements: 1.3, 2.1, 6.5_

- [x] 5. Create Releases page layout

  - Update home page to display release cards in responsive grid
  - Implement release card click navigation to individual release pages
  - Add page metadata and SEO optimization
  - _Requirements: 1.1, 1.4, 2.2_

- [x] 6. Implement dynamic release pages

  - Create dynamic route structure for individual release pages
  - Build release page layout with cover art and metadata display
  - Implement different layouts for singles vs EPs based on release type
  - Add navigation back to Releases
  - _Requirements: 2.3, 2.5, 7.1, 7.4_

- [x] 7. Build AudioPlayer component with Tone.js

  - Create AudioPlayer component using Tone.js for .m4a file playback
  - Implement play, pause, and seek controls with organic styling
  - Add progress tracking and duration display functionality
  - Handle audio loading states and error conditions
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8. Create interactive SongList component for EPs

  - Build SongList component with expandable song items
  - Implement click-to-expand functionality for individual songs
  - Add smooth animations for expand/collapse interactions
  - Integrate AudioPlayer component within expanded song sections
  - _Requirements: 3.2, 3.3, 3.4, 4.4_

- [x] 9. Add lyrics and copyright display functionality

  - Create expandable sections for lyrics display within song items
  - Implement copyright information display alongside lyrics
  - Add readable formatting and typography for lyrics content
  - Enable collapse functionality for expanded sections
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 17. Refactor to TracksList and LyricsDisplay architecture
- [x] 17.1 Update AudioContext to track selected song

  - Add `selectedSong` state to GlobalAudioState interface
  - Create `setSelectedSong` action and reducer case
  - Add `selectSong` method to AudioContextType
  - Export hook method for components to access selected song
  - _Requirements: 3.3, 4.1_

- [x] 17.2 Create TracksList component

  - Create new TracksList component directory with TypeScript and CSS module files
  - Implement simplified track list that displays song titles with play buttons
  - Add click handler to update global selectedSong state
  - Add visual indication for currently selected song
  - Remove lyrics and expandable functionality (simplified from SongList)
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 17.3 Create LyricsDisplay component

  - Create new LyricsDisplay component directory with TypeScript and CSS module files
  - Read selectedSong from AudioContext using useAudio hook
  - Display lyrics and copyright information for selected song
  - Handle empty state when no song is selected
  - Format lyrics with proper line breaks and typography
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 17.4 Implement CSS Grid layout on EP release page

  - Update releases/[slug]/page.module.css with CSS Grid layout
  - Define grid areas: cover (upper left), header (upper right), lyrics (full width bottom)
  - Position ReleaseCard in cover area
  - Position release header and TracksList in header area
  - Position LyricsDisplay in lyrics area spanning full width
  - Add responsive breakpoints for tablet and mobile layouts
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 17.5 Update EP release page to use new components

  - Replace EPLayout component usage with TracksList component
  - Add LyricsDisplay component below the grid
  - Update page structure to use CSS Grid layout
  - Remove old EPLayout and SongList component references
  - Test layout responsiveness and component integration
  - _Requirements: 3.1, 4.5, 8.1_

- [x] 17.6 Clean up deprecated components

  - Remove or deprecate EPLayout component
  - Update component exports and index files
  - Remove unused SongList component if no longer needed
  - Update any remaining references to old components
  - _Requirements: 3.1_

- [x] 10. Implement single release page layout

  - Create simplified layout for single-track releases
  - Provide direct access to lyrics and audio for single tracks
  - Maintain consistent navigation and branding elements
  - Differentiate single pages from EP pages through layout structure
  - _Requirements: 7.2, 7.3, 7.5_

- [x] 11. Add responsive design and mobile optimization

  - Ensure all components work across desktop and mobile devices
  - Implement touch-friendly interactions for mobile users
  - Test and optimize responsive grid layouts and navigation
  - Verify audio playback functionality on mobile browsers
  - _Requirements: 6.4, 5.5_

- [x] 12. Implement audio state management and navigation persistence

  - Enable audio playback to continue during page navigation
  - Implement global audio state management across components
  - Add visual indicators for currently playing tracks
  - Handle multiple audio instances and playback conflicts
  - _Requirements: 5.5_

- [x] 13. Add streaming platform links and icons

  - Update release interface in types to include bandcamp, spotify, and appleMusic URL properties
  - Modify data/releases.ts to include dummy URLs for all streaming platforms
  - Create streaming platform icons component with standard service icons
  - Implement streaming links section on release and single pages
  - Style icons with organic design principles and hover effects
  - _Requirements: 2.4, 6.5_

- [ ]\* 14. Add performance optimizations

  - Implement lazy loading for Tone.js library until first audio interaction
  - Optimize image loading with Next.js Image component features
  - Add audio file preloading for improved user experience
  - _Requirements: 5.2, 6.4_

- [ ]\* 15. Create error handling and loading states

  - Add graceful error handling for audio playback failures
  - Implement loading states for audio and image assets
  - Create user-friendly error messages and retry mechanisms
  - Add 404 handling for invalid release routes
  - _Requirements: 5.1, 5.2_

- [ ]\* 16. Write component unit tests
  - Create unit tests for ReleaseCard component click handling and rendering
  - Test AudioPlayer component with mocked audio functionality
  - Write tests for TracksList song selection and state updates
  - Write tests for LyricsDisplay rendering based on selected song
  - Test release data configuration and type safety
  - _Requirements: 9.1, 9.2, 9.3, 9.4_
