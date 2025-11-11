"use client";

import React, {
  createContext,
  useState,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Song, Release } from "@/types";

// Global audio state interface
export interface GlobalAudioState {
  currentTrack: {
    song: Song;
    release: Release;
  } | null;
  selectedSong: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  error?: string;
}

// Audio actions
type AudioAction =
  | { type: "SET_TRACK"; payload: { song: Song; release: Release } }
  | { type: "SET_SELECTED_SONG"; payload: Song | null }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "STOP" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_TIME"; payload: { currentTime: number; duration?: number } }
  | { type: "SET_ERROR"; payload: string | undefined }
  | { type: "CLEAR_TRACK" };

// Audio context interface
interface AudioContextType {
  state: GlobalAudioState;
  playerIsVisible: boolean;
  setPlayerIsVisible: (visible: boolean) => void;
  playTrack: (song: Song, release: Release) => void;
  pauseTrack: () => void;
  stopTrack: () => void;
  seekTo: (time: number) => void;
  isCurrentTrack: (songId: string) => boolean;
  selectSong: (song: Song | null) => void;
}

// Initial state
const initialState: GlobalAudioState = {
  currentTrack: null,
  selectedSong: null,
  isPlaying: false,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  error: undefined,
};

// Audio reducer
function audioReducer(
  state: GlobalAudioState,
  action: AudioAction
): GlobalAudioState {
  switch (action.type) {
    case "SET_TRACK":
      return {
        ...state,
        currentTrack: action.payload,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        error: undefined,
      };
    case "SET_SELECTED_SONG":
      return {
        ...state,
        selectedSong: action.payload,
      };
    case "PLAY":
      return {
        ...state,
        isPlaying: true,
        error: undefined,
      };
    case "PAUSE":
      return {
        ...state,
        isPlaying: false,
      };
    case "STOP":
      return {
        ...state,
        isPlaying: false,
        currentTime: 0,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_TIME":
      return {
        ...state,
        currentTime: action.payload.currentTime,
        duration: action.payload.duration ?? state.duration,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isPlaying: false,
      };
    case "CLEAR_TRACK":
      return initialState;
    default:
      return state;
  }
}

// Create context
const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Audio provider component
export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(audioReducer, initialState);
  const [playerIsVisible, setPlayerIsVisible] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio element for a track
  const initializeAudio = useCallback(
    (audioUrl: string) => {
      // Clean up existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener("loadedmetadata", () => {});
        audioRef.current.removeEventListener("error", () => {});
        audioRef.current.removeEventListener("timeupdate", () => {});
        audioRef.current.removeEventListener("ended", () => {});
        audioRef.current.removeEventListener("play", () => {});
        audioRef.current.removeEventListener("pause", () => {});
      }

      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const audio = new Audio(audioUrl);
        audio.preload = "metadata";
        (audio as any).playsInline = true;
        audio.crossOrigin = "anonymous";

        // Event listeners
        audio.addEventListener("loadedmetadata", () => {
          dispatch({
            type: "SET_TIME",
            payload: { currentTime: 0, duration: audio.duration || 0 },
          });
          dispatch({ type: "SET_LOADING", payload: false });
        });

        audio.addEventListener("error", () => {
          dispatch({
            type: "SET_ERROR",
            payload: `Failed to load audio: ${audio.error?.message || "Unknown error"}`,
          });
        });

        audio.addEventListener("timeupdate", () => {
          dispatch({
            type: "SET_TIME",
            payload: { currentTime: audio.currentTime },
          });
        });

        audio.addEventListener("ended", () => {
          dispatch({ type: "STOP" });
          stopProgressTracking();
        });

        audio.addEventListener("play", () => {
          dispatch({ type: "PLAY" });
          startProgressTracking();
        });

        audio.addEventListener("pause", () => {
          dispatch({ type: "PAUSE" });
          stopProgressTracking();
        });

        audioRef.current = audio;

        // Loading timeout
        setTimeout(() => {
          if (audioRef.current === audio && state.isLoading) {
            dispatch({
              type: "SET_ERROR",
              payload:
                "Audio loading timeout - file may not exist or be accessible",
            });
          }
        }, 10000);
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof Error
              ? error.message
              : "Audio initialization failed",
        });
      }
    },
    [state.isLoading]
  );

  // Progress tracking
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        dispatch({
          type: "SET_TIME",
          payload: { currentTime: audioRef.current.currentTime },
        });
      }
    }, 100);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Public methods
  const playTrack = useCallback(
    async (song: Song, release: Release) => {
      // Show the player when playing a track
      setPlayerIsVisible(true);

      // If it's a different track, set it up
      if (!state.currentTrack || state.currentTrack.song.id !== song.id) {
        dispatch({ type: "SET_TRACK", payload: { song, release } });
        initializeAudio(song.audioUrl);
        return;
      }

      // If it's the same track, just play/pause
      if (audioRef.current) {
        if (state.isPlaying) {
          audioRef.current.pause();
        } else {
          try {
            await audioRef.current.play();
          } catch (error) {
            dispatch({
              type: "SET_ERROR",
              payload:
                error instanceof Error ? error.message : "Playback failed",
            });
          }
        }
      }
    },
    [state.currentTrack, state.isPlaying, initializeAudio]
  );

  const pauseTrack = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, []);

  const stopTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    dispatch({ type: "STOP" });
    stopProgressTracking();
  }, [stopProgressTracking]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      dispatch({ type: "SET_TIME", payload: { currentTime: time } });
    }
  }, []);

  const isCurrentTrack = useCallback(
    (songId: string) => {
      return state.currentTrack?.song.id === songId;
    },
    [state.currentTrack]
  );

  const selectSong = useCallback((song: Song | null) => {
    dispatch({ type: "SET_SELECTED_SONG", payload: song });
  }, []);

  // Auto-play when track is set and audio is ready
  useEffect(() => {
    if (
      state.currentTrack &&
      audioRef.current &&
      !state.isLoading &&
      !state.error
    ) {
      const playAudio = async () => {
        try {
          await audioRef.current!.play();
        } catch (error) {
          dispatch({
            type: "SET_ERROR",
            payload: error instanceof Error ? error.message : "Playback failed",
          });
        }
      };
      playAudio();
    }
  }, [state.currentTrack, state.isLoading, state.error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressTracking();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [stopProgressTracking]);

  const contextValue: AudioContextType = {
    state,
    playerIsVisible,
    setPlayerIsVisible,
    playTrack,
    pauseTrack,
    stopTrack,
    seekTo,
    isCurrentTrack,
    selectSong,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

// Custom hook to use audio context
export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
