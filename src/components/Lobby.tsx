// src/components/Lobby.tsx

interface LobbyProps {
  onStart: () => void;
}

export function Lobby({ onStart }: LobbyProps) {
  return (
    <div className="flex-1 flex flex-col justify-center gap-6 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-2">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#00d4ff] font-bold">SoundStake</p>
        <h1 className="text-4xl font-black tracking-tight text-white">Clip Duel</h1>
      </div>

      <details className="group rounded-2xl border border-white/20 bg-white/[0.06] backdrop-blur-xl p-4">
        <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-bold text-zinc-100">
          <span>Instructions</span>
          <span className="text-zinc-400 transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
          Pick a song, then play longer clips until your opponents guess. The shorter the clip, the better the win.
        </p>
      </details>

      <button
        onClick={onStart}
        className="w-full rounded-2xl border border-[#00d4ff]/70 bg-[#00d4ff] py-4 text-black font-black text-lg tracking-[0.04em] shadow-[0_0_30px_rgba(0,212,255,0.45)] hover:shadow-[0_0_42px_rgba(0,212,255,0.6)] transition-all active:scale-[0.99]"
      >
        START GAME
      </button>
    </div>
  );
}
