import Image from 'next/image';
import type { DeezerTrack } from '@/lib/services/deezer';

interface RoundRevealProps {
  track: DeezerTrack | null;
  loading: boolean;
  onPlayFullClip: () => void;
  onSelectAnotherSong: () => void;
}

export function RoundReveal({ track, loading, onPlayFullClip, onSelectAnotherSong }: RoundRevealProps) {
  return (
    <div className="flex-1 flex flex-col justify-center gap-6 animate-in fade-in zoom-in duration-300">
      <div className="text-center space-y-2">
        <p className="text-[#ffe66d] uppercase font-black text-xs tracking-[0.25em]">Round complete</p>
        <h2 className="text-3xl font-black text-white">What&apos;s next?</h2>
      </div>

      {track && (
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/40 p-4">
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
