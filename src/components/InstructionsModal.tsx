interface InstructionsModalProps {
  onClose: () => void;
}

export function InstructionsModal({ onClose }: InstructionsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm px-6 py-10 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-xl p-5 shadow-[0_14px_48px_rgba(0,0,0,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-white font-black text-lg">How to play</h2>
          <button
            type="button"
            aria-label="Close instructions"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-white/25 bg-black/30 text-zinc-300 hover:text-white hover:border-[#00d4ff]/70 transition-all"
          >
            ×
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm text-zinc-200 leading-relaxed">
          <p>1. Search and choose a song.</p>
          <p>2. Play short clips, then longer ones if needed.</p>
          <p>3. Win by getting the guess on the shortest clip.</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl border border-[#00d4ff]/70 bg-[#00d4ff] py-3 text-black text-xs font-black uppercase tracking-[0.12em] shadow-[0_0_18px_rgba(0,212,255,0.35)]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
