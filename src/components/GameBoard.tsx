// src/components/GameBoard.tsx
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DeezerTrack } from '@/lib/services/deezer';

interface GameBoardProps {
  trialDurations: number[];
  track: DeezerTrack | null;
  onPlayChunk: (seconds: number) => void;
  onPauseChunk: () => void;
  onResumeChunk: () => void;
  onMaxIncorrect: () => void;
  onSelectAnotherSong: () => void;
  audioMeter: number;
  audioBands: number[];
  isAudioPlaying: boolean;
}

type PlaybackState = 'idle' | 'playing' | 'paused' | 'ended';

function EyeOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <path d="M2 12c2.6-4.2 5.9-6.3 10-6.3s7.4 2.1 10 6.3c-2.6 4.2-5.9 6.3-10 6.3S4.6 16.2 2 12Z" />
      <circle cx="12" cy="12" r="3.1" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <path d="M2 12c2.6-4.2 5.9-6.3 10-6.3 1.8 0 3.5.4 5 1.3" />
      <path d="M22 12c-2.6 4.2-5.9 6.3-10 6.3-1.8 0-3.5-.4-5-1.3" />
      <path d="m3 3 18 18" />
    </svg>
  );
}

const CELEBRATION_COLORS = ['#39ff14', '#34d399', '#22c55e', '#4ade80', '#86efac', '#16a34a'];
const CELEBRATION_PARTICLES = Array.from({ length: 96 }, (_, idx) => ({
  id: idx,
  left: 50 + (((idx * 17) % 35) - 17),
  delay: (idx % 12) * 35,
  duration: 1360 + (idx % 7) * 95,
  launchX: (idx % 2 === 0 ? 1 : -1) * (24 + (idx % 10) * 8),
  launchY: 42 + (idx % 9) * 5,
  drift: (idx % 2 === 0 ? 1 : -1) * (56 + (idx % 8) * 9),
  rotate: 290 + (idx % 8) * 60,
  color: CELEBRATION_COLORS[idx % CELEBRATION_COLORS.length],
  width: 5 + (idx % 5) * 2,
  height: 10 + (idx % 6) * 2
}));
const CELEBRATION_DURATION_MS = 1650;
const REDUCED_MOTION_CELEBRATION_MS = 500;
const AUTO_ADVANCE_AFTER_END_MS = 650;

export function GameBoard({
  trialDurations,
  track,
  onPlayChunk,
  onPauseChunk,
  onResumeChunk,
  onMaxIncorrect,
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
  const [isTrackPanelRevealed, setIsTrackPanelRevealed] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isAwaitingRoundAdvance, setIsAwaitingRoundAdvance] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [celebrationTick, setCelebrationTick] = useState(0);
  const toggleTrackPanelReveal = () => setIsTrackPanelRevealed((prev) => !prev);
  const selectedDuration = trialDurations[selectedChunkIdx] ?? trialDurations[0];
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const celebrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef(0);

  const clearTicker = () => {
    if (!tickerRef.current) return;
    clearInterval(tickerRef.current);
    tickerRef.current = null;
  };

  const clearAutoAdvanceTimer = () => {
    if (!autoAdvanceTimeoutRef.current) return;
    clearTimeout(autoAdvanceTimeoutRef.current);
    autoAdvanceTimeoutRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearTicker();
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }
      clearAutoAdvanceTimer();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    applyPreference();
    mediaQuery.addEventListener('change', applyPreference);

    return () => {
      mediaQuery.removeEventListener('change', applyPreference);
    };
  }, []);

  useEffect(() => {
    if (!isAwaitingRoundAdvance || playbackState !== 'ended') return;
    clearAutoAdvanceTimer();
    autoAdvanceTimeoutRef.current = setTimeout(() => {
      autoAdvanceTimeoutRef.current = null;
      setIsAwaitingRoundAdvance(false);
      onSelectAnotherSong();
    }, AUTO_ADVANCE_AFTER_END_MS);
  }, [isAwaitingRoundAdvance, playbackState, onSelectAnotherSong]);

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
  const isAtMaxChunk = selectedChunkIdx === trialDurations.length - 1;

  const handleGuessCorrect = () => {
    if (isAwaitingRoundAdvance) return;
    const fullClipIdx = trialDurations.length - 1;
    const fullClipDuration = trialDurations[fullClipIdx] ?? FULL_CLIP_SECONDS;
    const celebrationDuration = prefersReducedMotion ? REDUCED_MOTION_CELEBRATION_MS : CELEBRATION_DURATION_MS;
    if (!isCelebrating) {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }
      setCelebrationTick((prev) => prev + 1);
      setIsCelebrating(true);
      celebrationTimeoutRef.current = setTimeout(() => {
        setIsCelebrating(false);
        celebrationTimeoutRef.current = null;
      }, celebrationDuration);
    }
    clearAutoAdvanceTimer();
    setIsAwaitingRoundAdvance(true);
    setIsTrackPanelRevealed(true);
    startChunkPlayback(fullClipDuration, fullClipIdx);
  };

  const handleGuessIncorrect = () => {
    if (isAtMaxChunk) {
      if (playbackState === 'playing') {
        onPauseChunk();
      }
      clearTicker();
      elapsedRef.current = 0;
      setElapsedSeconds(0);
      setPlaybackState('idle');
      setIsAwaitingRoundAdvance(false);
      clearAutoAdvanceTimer();
      onMaxIncorrect();
      return;
    }

    if (playbackState === 'playing') {
      onPauseChunk();
    }

    clearTicker();
    elapsedRef.current = 0;
    setElapsedSeconds(0);
    setPlaybackState('idle');
    setSelectedChunkIdx((prev) => Math.min(trialDurations.length - 1, prev + 1));
  };

  const celebrationOverlay = isCelebrating ? (
    <div key={celebrationTick} className="pt-celebration-overlay pointer-events-none fixed inset-0 z-[200] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.4),transparent_62%)]" />

      <div className="absolute inset-x-0 top-[32%] flex justify-center px-6">
        <div className="pt-celebrate-pop rounded-2xl border border-[#39ff14]/75 bg-[#39ff14]/90 px-6 py-3 text-center shadow-[0_0_34px_rgba(57,255,20,0.55)]">
          <p className="text-black text-xs font-black uppercase tracking-[0.14em]">They guessed correctly!</p>
        </div>
      </div>

      {!prefersReducedMotion &&
        CELEBRATION_PARTICLES.map((piece) => (
          <span
            key={piece.id}
            className="pt-confetti-piece absolute rounded-sm"
            style={
              {
                left: `${piece.left}%`,
                bottom: '-24px',
                width: `${piece.width}px`,
                height: `${piece.height}px`,
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}ms`,
                animationDuration: `${piece.duration}ms`,
                '--pt-confetti-launch-x': `${piece.launchX}px`,
                '--pt-confetti-launch-y': `${piece.launchY}vh`,
                '--pt-confetti-drift': `${piece.drift}px`,
                '--pt-confetti-rotate': `${piece.rotate}deg`
              } as React.CSSProperties
            }
          />
        ))}
    </div>
  ) : null;

  return (
    <div className="flex-1 flex flex-col py-6 animate-in fade-in zoom-in duration-300">
      <div className="space-y-5">
        {track && (
          <div className="relative">
            <button
              type="button"
              onClick={toggleTrackPanelReveal}
              aria-label={isTrackPanelRevealed ? 'Hide song details' : 'Reveal song details'}
              aria-pressed={isTrackPanelRevealed}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 grid place-items-center w-8 h-8 rounded-full border border-white/20 bg-black/50 text-zinc-200 hover:text-white hover:border-[#00d4ff]/60 transition-all"
            >
              {isTrackPanelRevealed ? <EyeClosedIcon /> : <EyeOpenIcon />}
            </button>

            <button
              type="button"
              onClick={toggleTrackPanelReveal}
              aria-label="Toggle track detail blur"
              aria-pressed={isTrackPanelRevealed}
              className={`rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-3 shadow-[0_8px_28px_rgba(0,0,0,0.25)] transition-[filter,opacity] duration-200 ${
                isTrackPanelRevealed ? 'blur-0 opacity-100' : 'blur-md opacity-70'
              } text-left w-full`}
            >
              <div className="flex items-center gap-3 pr-11">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                  {track.album?.cover_medium ? (
                    <Image
                      src={track.album.cover_medium}
                      alt={`${track.title} artwork`}
                      width={48}
                      height={48}
                      className="object-cover"
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
            </button>
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

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGuessCorrect}
            className="rounded-xl border border-[#10b981]/70 bg-[#10b981] py-3 text-black text-xs font-black uppercase tracking-[0.1em] shadow-[0_0_18px_rgba(16,185,129,0.35)] hover:shadow-[0_0_24px_rgba(16,185,129,0.5)] transition-all"
          >
            Guess Correct
          </button>
          <button
            type="button"
            onClick={handleGuessIncorrect}
            className="rounded-xl border border-[#f59e0b]/70 bg-[#f59e0b] py-3 text-black text-xs font-black uppercase tracking-[0.1em] shadow-[0_0_18px_rgba(245,158,11,0.35)] hover:shadow-[0_0_24px_rgba(245,158,11,0.5)] transition-all"
          >
            Incorrect
          </button>
        </div>
      </div>

      <div className="pt-12">
        <button
          type="button"
          onClick={() => {
            setIsAwaitingRoundAdvance(false);
            clearAutoAdvanceTimer();
            onSelectAnotherSong();
          }}
          className="w-full rounded-xl border border-[#00d4ff]/80 bg-[#00d4ff] py-3 text-black font-black text-xs uppercase tracking-[0.14em] shadow-[0_0_20px_rgba(0,212,255,0.35)] hover:shadow-[0_0_28px_rgba(0,212,255,0.5)] active:scale-[0.995] transition-all"
        >
          CHOOSE ANOTHER SONG
        </button>
      </div>

      {celebrationOverlay &&
        (typeof document === 'undefined' ? celebrationOverlay : createPortal(celebrationOverlay, document.body))}
    </div>
  );
}
