'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';
import type { DeezerTrack } from '@/lib/services/deezer';
import Image from 'next/image';
import { AppTopBar } from '@/components/AppTopBar';
import { InstructionsModal } from '@/components/InstructionsModal';

const INSTRUCTIONS_SEEN_KEY = 'soundstake.instructions_seen';

export default function ChoosePage() {
  const router = useRouter();
  const [showInstructions, setShowInstructions] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(INSTRUCTIONS_SEEN_KEY) !== '1';
  });
  const {
    step,
    setStep,
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    selectSong,
    confirmSong
  } = useGame();

  useEffect(() => {
    if (step === 'LOBBY' || step === 'START_SCREEN') {
      setStep('DJ_CHOOSE');
      return;
    }

    if (step === 'GUESSING' || step === 'ROUND_REVEAL' || step === 'GAME_OVER') {
      router.replace('/play');
    }
  }, [step, setStep, router]);

  useEffect(() => {
    if (!showInstructions) return;
    window.localStorage.setItem(INSTRUCTIONS_SEEN_KEY, '1');
  }, [showInstructions]);

  const handleConfirmSong = (track: DeezerTrack) => {
    confirmSong(track);
    router.push('/play');
  };

  if (step === 'GUESSING' || step === 'ROUND_REVEAL' || step === 'GAME_OVER') {
    return null;
  }

  const playableTracks = searchResults.filter((track) => track.preview);
  const showingResults = step === 'SONG_RESULTS';

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col font-sans select-none">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1 gap-4">
        <AppTopBar onOpenInfo={() => setShowInstructions(true)} />

        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-4 shadow-[0_8px_28px_rgba(0,0,0,0.25)]">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#00d4ff] font-bold">Choose Song</p>
          <p className="text-sm text-zinc-300 mt-1">
            Search an artist or title, then select the track for this round.
          </p>

          <form onSubmit={selectSong} className="mt-4 flex gap-2">
            <input
              autoFocus
              className="flex-1 rounded-xl border border-white/20 bg-black/35 px-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-[#00d4ff] focus:shadow-[0_0_16px_rgba(0,212,255,0.25)] transition-all"
              placeholder="Search artist or song"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl border border-[#00d4ff]/80 bg-[#00d4ff] px-4 py-3 text-black text-xs font-black uppercase tracking-[0.12em] shadow-[0_0_20px_rgba(0,212,255,0.35)] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_28px_rgba(0,212,255,0.5)] transition-all"
            >
              {loading ? '...' : 'Search'}
            </button>
          </form>
        </div>

        {showingResults && (
          <div className="flex items-center px-1">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-semibold">
              {playableTracks.length > 0 ? `${playableTracks.length} results` : 'No playable tracks'}
            </p>
          </div>
        )}

        {showingResults && playableTracks.length > 0 && (
          <ul className="space-y-2 overflow-y-auto max-h-[55vh] pr-1">
            {playableTracks.map((track) => (
              <li key={track.id}>
                <button
                  onClick={() => handleConfirmSong(track)}
                  className="w-full flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-[#00d4ff]/55 p-3 text-left transition-all"
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                    {track.album?.cover_medium ? (
                      <Image
                        src={track.album.cover_medium}
                        alt={track.title}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-zinc-500" aria-hidden>
                        ♪
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold truncate">{track.title}</p>
                    <p className="text-zinc-400 text-sm truncate">{track.artist.name}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-[#00d4ff] font-bold">Select</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {showingResults && playableTracks.length === 0 && (
          <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 text-center">
            <p className="text-zinc-300 text-sm">No playable results found. Try a different search.</p>
          </div>
        )}

        {!showingResults && (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-zinc-500 text-sm">
            Search above to load tracks.
          </div>
        )}
      </div>

      {showInstructions && (
        <InstructionsModal onClose={() => setShowInstructions(false)} />
      )}
    </main>
  );
}
