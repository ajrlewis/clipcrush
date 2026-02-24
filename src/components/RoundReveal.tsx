import Image from 'next/image';
import { useState } from 'react';
import type { DeezerTrack } from '@/lib/services/deezer';

interface RoundRevealProps {
  track: DeezerTrack | null;
  loading: boolean;
  onPlayFullClip: () => void;
  onSelectAnotherSong: () => void;
}

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

export function RoundReveal({ track, loading, onPlayFullClip, onSelectAnotherSong }: RoundRevealProps) {
  const [isTrackPanelRevealed, setIsTrackPanelRevealed] = useState(false);

  return (
    <div className="flex-1 flex flex-col justify-center gap-6 animate-in fade-in zoom-in duration-300">
      <div className="text-center space-y-2">
        <p className="text-[#ffe66d] uppercase font-black text-xs tracking-[0.25em]">Round complete</p>
        <h2 className="text-3xl font-black text-white">What&apos;s next?</h2>
      </div>

      {track && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsTrackPanelRevealed((prev) => !prev)}
            aria-label={isTrackPanelRevealed ? 'Hide song details' : 'Reveal song details'}
            aria-pressed={isTrackPanelRevealed}
            className="absolute right-2 top-2 z-10 grid place-items-center w-8 h-8 rounded-full border border-white/20 bg-black/50 text-zinc-200 hover:text-white hover:border-[#00d4ff]/60 transition-all"
          >
            {isTrackPanelRevealed ? <EyeClosedIcon /> : <EyeOpenIcon />}
          </button>

          <div
            className={`rounded-2xl border border-white/10 bg-black/40 p-4 transition-[filter,opacity] duration-200 ${
              isTrackPanelRevealed ? 'blur-0 opacity-100' : 'blur-md opacity-70'
            }`}
          >
            <div className="flex items-center gap-4 pr-11">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                {track.album?.cover_medium ? (
                  <Image
                    src={track.album.cover_medium}
                    alt={`${track.title} artwork`}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 text-2xl" aria-hidden>
                    ♪
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#ffe66d] font-black mb-1">
                  Song revealed
                </p>
                <p className="text-white font-black text-lg truncate">{track.title}</p>
                <p className="text-zinc-400 text-sm truncate">{track.artist.name}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onPlayFullClip}
        disabled={loading}
        className="w-full rounded-3xl py-5 px-4 bg-gradient-to-r from-[#00d4ff] to-[#b026ff] text-white font-black text-lg hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Loading full clip...' : 'Play full clip'}
      </button>

      <button
        onClick={onSelectAnotherSong}
        className="w-full rounded-3xl py-5 px-4 border-2 border-white/20 bg-black/40 text-white font-black text-lg hover:border-[#ffe66d] hover:text-[#ffe66d] transition-all"
      >
        Select another song
      </button>
    </div>
  );
}
