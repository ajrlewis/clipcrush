interface AppTopBarProps {
  onOpenInfo: () => void;
}

export function AppTopBar({ onOpenInfo }: AppTopBarProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-[#00d4ff] text-xs drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]">♪</span>
        <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-200 font-bold">SoundStake</p>
        <span className="text-[#00d4ff] text-xs drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]">♫</span>
      </div>
      <button
        type="button"
        aria-label="Show instructions"
        onClick={onOpenInfo}
        className="w-7 h-7 rounded-full border border-white/25 bg-white/[0.08] text-zinc-200 text-xs font-black hover:border-[#00d4ff]/70 hover:text-white hover:shadow-[0_0_14px_rgba(0,212,255,0.28)] transition-all"
      >
        i
      </button>
    </div>
  );
}
