// src/components/GameBoard.tsx
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { DeezerTrack } from '@/lib/services/deezer';

interface GameBoardProps {
  trialDurations: number[];
  track: DeezerTrack | null;
  onPlayChunk: (seconds: number) => void;
  onPauseChunk: () => void;
  onResumeChunk: () => void;
  onSelectAnotherSong: () => void;
  audioMeter: number;
  audioBands: number[];
  isAudioPlaying: boolean;
}

type PlaybackState = 'idle' | 'playing' | 'paused' | 'ended';

export function GameBoard({
  trialDurations,
  track,
  onPlayChunk,
  onPauseChunk,
  onResumeChunk,
  onSelectAnotherSong,
  audioMeter,
  audioBands,
  isAudioPlaying
}: GameBoardProps) {
  const FULL_CLIP_SECONDS = 30;
  const CLOCK_RADIUS = 92;
  const CLOCK_CIRCUMFERENCE = 2 * Math.PI * CLOCK_RADIUS;

  const [selectedChunkIdx, setSelectedChunkIdx] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const selectedDuration = trialDurations[selectedChunkIdx] ?? trialDurations[0];
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  const clearTicker = () => {
    if (!tickerRef.current) return;
    clearInterval(tickerRef.current);
    tickerRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearTicker();
    };
  }, []);

  const startTicker = (duration: number) => {
    const stepMs = 50;
    clearTicker();

    tickerRef.current = setInterval(() => {
      elapsedRef.current = Math.min(duration, elapsedRef.current + stepMs / 1000);
      setElapsedSeconds(elapsedRef.current);

      if (elapsedRef.current >= duration) {
        clearTicker();
        setPlaybackState('ended');
      }
    }, stepMs);
  };

  const startChunkPlayback = (duration: number, idx?: number) => {
    if (typeof idx === 'number') {
      setSelectedChunkIdx(idx);
    }

    elapsedRef.current = 0;
    setElapsedSeconds(0);
    setPlaybackState('playing');
    onPlayChunk(duration);
    startTicker(duration);
  };

  const handleChunkPlay = (idx: number) => {
    startChunkPlayback(trialDurations[idx], idx);
  };

  const goChunk = (direction: -1 | 1) => {
    const nextIdx = Math.max(0, Math.min(trialDurations.length - 1, selectedChunkIdx + direction));
    if (nextIdx === selectedChunkIdx) return;
    startChunkPlayback(trialDurations[nextIdx], nextIdx);
  };

  const pauseCurrentPlayback = () => {
    if (playbackState !== 'playing') return;
    onPauseChunk();
    clearTicker();
    setPlaybackState('paused');
  };

  const resumeCurrentPlayback = () => {
    if (playbackState !== 'paused') return;
    onResumeChunk();
    setPlaybackState('playing');
    startTicker(selectedDuration);
  };

  const handleCenterControl = () => {
    if (playbackState === 'playing') {
      pauseCurrentPlayback();
      return;
    }

    if (playbackState === 'paused') {
      resumeCurrentPlayback();
      return;
    }

    startChunkPlayback(selectedDuration);
  };

  const centerIcon = playbackState === 'playing' ? '⏸' : playbackState === 'ended' ? '↺' : '▶';
  const ringGlow = 12 + audioMeter * 32;
  const compactBars = Array.from({ length: 8 }, (_, idx) => {
    const sourceIdx = Math.floor((idx / 7) * Math.max(0, audioBands.length - 1));
    return audioBands[sourceIdx] ?? 0;
  });

  const progressRatio = Math.min(elapsedSeconds / FULL_CLIP_SECONDS, 1);
  const progressOffset = CLOCK_CIRCUMFERENCE * (1 - progressRatio);

  return (
    <div className="flex-1 flex flex-col py-6 animate-in fade-in zoom-in duration-300">
      <div className="space-y-5">
        {track && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-3 shadow-[0_8px_28px_rgba(0,0,0,0.25)]">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
              {track.album?.cover_medium ? (
                <Image
                  src={track.album.cover_medium}
                  alt={`${track.title} artwork`}
                  width={48}
                  height={48}
                  className="object-cover scale-110 blur-[1.5px]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-2xl" aria-hidden>
                  ♪
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white truncate">
                <span className="text-zinc-300">Now Playing:</span>{' '}
                <span className="font-black">{track.title}</span>{' '}
                <span className="text-zinc-300">by</span>{' '}
                <span className="font-black">{track.artist.name}</span>
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 py-1">
          <button
            type="button"
            onClick={() => goChunk(-1)}
            disabled={selectedChunkIdx === 0}
            aria-label="Back one chunk"
            className="w-11 h-11 rounded-full border border-white/15 bg-zinc-900/75 text-zinc-200 grid place-items-center hover:border-white/35 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            <span className="text-xl leading-none">‹</span>
          </button>

          <button
            type="button"
            onClick={handleCenterControl}
            className="flex items-center justify-center"
            aria-label={`${playbackState === 'playing' ? 'Pause' : playbackState === 'paused' ? 'Resume' : playbackState === 'ended' ? 'Replay' : 'Play'} ${selectedDuration} second clip`}
          >
            <div className="relative w-56 h-56 rounded-full grid place-items-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 232 232" aria-hidden>
                <circle
                  cx="116"
                  cy="116"
                  r={CLOCK_RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="14"
                />
                <circle
                  cx="116"
                  cy="116"
                  r={CLOCK_RADIUS}
                  fill="none"
                  stroke="#00d4ff"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={CLOCK_CIRCUMFERENCE}
                  strokeDashoffset={progressOffset}
                  className="transition-[stroke-dashoffset] duration-75 ease-linear"
                  style={{ filter: `drop-shadow(0 0 ${ringGlow}px rgba(0,212,255,0.95))` }}
                />
              </svg>

              <div className="relative w-40 h-40 rounded-full border border-white/20 bg-black/50 flex flex-col items-center justify-center shadow-[0_0_32px_rgba(0,212,255,0.2)]">
                <span className="text-[#00d4ff] text-2xl leading-none">{centerIcon}</span>
                <span className="mt-2 text-white text-2xl font-black tracking-tight">
                  {elapsedSeconds.toFixed(1)}s / {selectedDuration}s
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => goChunk(1)}
            disabled={selectedChunkIdx === trialDurations.length - 1}
            aria-label="Forward one chunk"
            className="w-11 h-11 rounded-full border border-white/15 bg-zinc-900/75 text-zinc-200 grid place-items-center hover:border-white/35 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            <span className="text-xl leading-none">›</span>
          </button>
        </div>

        <div className="h-8 flex items-end justify-center gap-1.5" aria-hidden>
          {compactBars.map((band, idx) => {
            const intensity = isAudioPlaying ? Math.max(0, band - 0.03) : 0;
            const height = 4 + intensity * 16;
            const opacity = isAudioPlaying ? 0.18 + intensity * 0.78 : 0.08;
            return (
              <span
                key={idx}
                className="w-1.5 rounded-full bg-[#00d4ff] transition-[height,opacity] duration-100 ease-out"
                style={{
                  height: `${height}px`,
                  opacity,
                  boxShadow: `0 0 ${4 + intensity * 8}px rgba(0,212,255,0.45)`
                }}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {trialDurations.map((duration, idx) => {
            const isSelected = idx === selectedChunkIdx;
            return (
              <button
                key={duration}
                type="button"
                onClick={() => handleChunkPlay(idx)}
                className={`rounded-xl border py-3 text-sm font-black transition-all ${
                  isSelected
                    ? 'border-[#00d4ff] bg-[#00d4ff] text-black shadow-[0_0_24px_rgba(0,212,255,0.75),0_0_48px_rgba(0,212,255,0.45)]'
                    : 'border-white/20 bg-black/35 text-white hover:border-white/50'
                }`}
              >
                {duration}s
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-12">
        <button
          type="button"
          onClick={onSelectAnotherSong}
          className="w-full rounded-xl border border-[#00d4ff]/80 bg-[#00d4ff] py-3 text-black font-black text-xs uppercase tracking-[0.14em] shadow-[0_0_20px_rgba(0,212,255,0.35)] hover:shadow-[0_0_28px_rgba(0,212,255,0.5)] active:scale-[0.995] transition-all"
        >
          CHOOSE ANOTHER SONG
        </button>
      </div>
    </div>
  );
}
