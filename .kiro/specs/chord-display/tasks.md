# Implementation Plan

- [x] 1. Set up dependencies and project structure

  - Install chordsheetjs library (^8.0.0) via npm
  - Create ChordDisplay component directory with TypeScript and CSS module files
  - Create ViewToggle component directory with TypeScript and CSS module files
  - Create public/assets/chordpro directory for ChordPro files
  - _Requirements: 5.1, 5.2_

- [x] 2. Extend data models for chord sheet support

  - Add optional chordProUrl property to Song interface in src/types/index.ts
  - Update at least one song in src/data/releases.ts with a chordProUrl reference for testing
  - _Requirements: 6.1, 6.2_

- [x] 3. Create example ChordPro test file

  - Create public/assets/chordpro/example-song.txt with valid ChordPro syntax
  - Include title, artist, key metadata directives
  - Include verse and chorus sections with chord annotations
  - Use standard ChordPro format with chords in square brackets
  - _Requirements: 5.3, 5.4, 5.5_

- [x] 4. Create faithful-one.txt ChordPro file

  - Create public/assets/chordpro/faithful-one.txt matching the song referenced in releases.ts
  - Include title, artist, key metadata directives
  - Add verse, chorus, and bridge sections with chord annotations
  - Use standard ChordPro format with chords in square brackets
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1_

- [x] 5. Build core ChordDisplay component
- [x] 5.1 Implement ChordDisplay component structure and state management

  - Create ChordDisplay.tsx with component structure
  - Define ChordDisplayProps interface with chordProUrl and releaseType
  - Define internal state for chordSheet, isLoading, error, originalKey, selectedKey, isFocusMode
  - Implement useState hooks for managing component state
  - Create index.ts export barrel file
  - Create ChordDisplay.module.css file
  - _Requirements: 1.1, 6.4_

- [x] 5.2 Implement ChordPro file fetching and parsing

  - Add useEffect to fetch ChordPro file from chordProUrl prop
  - Use ChordProParser from chordsheetjs to parse fetched text
  - Extract originalKey from parsed ChordSheet metadata
  - Set selectedKey to originalKey on initial load
  - Handle loading states during fetch and parse operations
  - _Requirements: 1.1, 1.5, 6.5_

- [x] 5.3 Implement chord sheet rendering

  - Use HtmlTableFormatter from chordsheetjs to format parsed ChordSheet
  - Render formatted HTML with chords positioned above lyrics
  - Apply CSS styling to distinguish chords from lyrics text
  - Display song metadata (title, artist, key) from ChordPro directives
  - Ensure proper spacing and alignment between chords and lyrics
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 5.4 Add error handling and empty states

  - Implement error handling for 404 errors with user-friendly message
  - Handle ChordPro parse errors with appropriate error display
  - Add retry mechanism for network errors
  - Display loading spinner during fetch operations
  - _Requirements: 6.5_

- [x] 6. Implement key transposition functionality
- [x] 6.1 Create transposition control UI

  - Add key selection dropdown or button grid with all 12 musical keys
  - Display current selectedKey in the UI
  - Style transposition controls to match organic design system
  - Make controls responsive for mobile, tablet, and desktop
  - _Requirements: 2.1, 2.2, 7.3_

- [x] 6.2 Implement transposition logic

  - Create function to calculate semitones between originalKey and target key
  - Use chordsheetjs transpose() method to transpose ChordSheet
  - Update selectedKey state when user selects new key
  - Re-render formatted chord sheet with transposed chords
  - Preserve chord quality (major, minor, seventh, etc.) during transposition
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 7. Build ViewToggle component
- [x] 7.1 Create ViewToggle component structure

  - Create src/components/ViewToggle directory
  - Create ViewToggle.tsx with component structure
  - Define ViewToggleProps interface with currentView, onViewChange, hasChords
  - Implement segmented control style UI (iOS-inspired)
  - Create ViewToggle.module.css for styling
  - Create index.ts export barrel file
  - _Requirements: 3.1, 3.2_

- [x] 7.2 Implement toggle functionality and styling

  - Add click handlers to switch between "lyrics" and "chords" views
  - Highlight active view with visual indicator
  - Add smooth transition animations between states
  - Ensure accessibility with keyboard navigation and ARIA labels
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 8. Integrate ChordDisplay and ViewToggle into release page
- [x] 8.1 Update release page with view state management

  - Convert src/app/releases/[slug]/page.tsx to client component with "use client" directive
  - Add useState hook for currentView state
  - Initialize currentView to "lyrics" by default
  - Use AudioContext to get selectedSong
  - Determine hasChords based on selectedSong.chordProUrl availability
  - _Requirements: 3.5, 6.2, 6.3_

- [x] 8.2 Implement conditional rendering of lyrics and chords

  - Import ViewToggle and ChordDisplay components
  - Render ViewToggle component when hasChords is true
  - Conditionally render LyricsDisplay when currentView is "lyrics"
  - Conditionally render ChordDisplay when currentView is "chords"
  - Pass chordProUrl prop to ChordDisplay component
  - Maintain existing layout structure in lyrics area
  - _Requirements: 3.3, 3.4, 6.2_

- [ ] 9. Implement focus mode functionality
- [ ] 9.1 Create focus mode overlay structure

  - Add isFocusMode state to ChordDisplay component
  - Create focus mode activation button in ChordDisplay UI
  - Implement portal-based rendering for focus mode overlay using React portals
  - Add exit button in top-right corner of focus mode
  - _Requirements: 4.1, 4.5_

- [ ] 9.2 Style focus mode for performance readability

  - Apply fixed positioning covering entire viewport
  - Set black background color and white text
  - Increase font sizes for improved readability
  - Set z-index to 999 (below global audio player at 1000)
  - Add scroll support for long chord sheets
  - Ensure global audio player remains visible and functional
  - _Requirements: 4.2, 4.3, 4.4, 4.7, 7.4_

- [ ] 9.3 Add focus mode keyboard controls

  - Implement ESC key handler to exit focus mode
  - Preserve scroll position when entering/exiting focus mode
  - Ensure keyboard navigation works in focus mode
  - _Requirements: 4.6_

- [ ] 10. Implement download functionality
- [ ] 10.1 Add download controls to ChordDisplay UI

  - Create download button or dropdown menu in ChordDisplay component
  - Add options for "Download as ChordPro" and "Download as PDF"
  - Style download controls to match organic design system
  - Position controls near transposition controls
  - _Requirements: 8.1_

- [ ] 10.2 Implement ChordPro .txt export

  - Create function to generate transposed ChordPro text from current ChordSheet
  - Preserve all ChordPro directives and formatting in export
  - Use browser Blob API to create downloadable .txt file
  - Set filename format as {song-title}-{key}.txt
  - Trigger download when user clicks ChordPro export option
  - _Requirements: 8.2, 8.4_

- [ ] 10.3 Implement PDF export

  - Integrate jsPDF library or use browser print API for PDF generation
  - Render formatted chord sheet with chords and lyrics in print-friendly format
  - Include song metadata (title, artist, key) in PDF header
  - Set filename format as {song-title}-{key}.pdf
  - Trigger download when user clicks PDF export option
  - _Requirements: 8.3, 8.5_

- [ ] 11. Add responsive design and styling

  - Ensure ChordDisplay component adapts to mobile, tablet, and desktop viewports
  - Maintain chord-to-lyric alignment across different screen sizes
  - Use responsive font sizes that scale appropriately
  - Test transposition controls on mobile devices
  - Verify focus mode works correctly on mobile with touch controls
  - Apply modern organic design principles with CSS custom properties
  - _Requirements: 6.3, 6.4, 7.1, 7.2, 7.5_

- [ ] 12. Add CSS styling and design polish

  - Enhance ChordDisplay.module.css with organic design styling
  - Use monospace font (Geist Mono) for chords
  - Use sans-serif font (Geist Sans) for lyrics
  - Apply color palette for focus mode (black bg, white text, gold chords)
  - Style transposition controls with hover and focus states
  - Add smooth transitions and animations
  - Ensure accessibility with proper focus indicators
  - _Requirements: 1.3, 6.1, 6.2, 7.1_

- [ ]\* 13. Write component tests
  - Write unit tests for ChordDisplay component parsing and rendering
  - Test transposition logic with various key changes
  - Test ViewToggle state changes and button interactions
  - Test focus mode enter/exit behavior
  - Test download functionality for ChordPro and PDF exports
  - Test error handling for invalid ChordPro files
  - Test responsive behavior across viewport sizes
  - _Requirements: 1.1, 2.3, 3.2, 4.1, 8.2, 8.3_
