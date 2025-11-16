// Core data models for the artist portfolio

export interface Song {
  id: string;
  title: string;
  audioUrl: string;
  lyrics?: string;
  copyright?: string;
  duration?: number;
  chordProUrl?: string;
}

export interface Release {
  id: string;
  title: string;
  type: "single" | "ep";
  coverArt: string;
  songs: Song[];
  description?: string;
  streamingLinks?: {
    bandcamp?: string;
    spotify?: string;
    appleMusic?: string;
  };
}

// Audio player related types
export interface AudioPlayerProps {
  audioUrl: string;
  title: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  error?: string;
}

// Component prop types
export interface ReleaseCardProps {
  release: Release;
}
