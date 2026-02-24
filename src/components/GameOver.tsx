// src/components/GameOver.tsx

interface GameOverProps {
  activeTeam: 'A' | 'B';
  onPlayAgain: () => void;
  onBackToChoose: () => void;
}
  
export function GameOver({ activeTeam, onPlayAgain, onBackToChoose }: GameOverProps) {
  const winnerName = activeTeam === 'A' ? 'TEAM ECHO' : 'TEAM PULSE';
  const winnerColor = activeTeam === 'A' ? 'text-[#ff4d8a]' : 'text-[#5eead4]';
  const glowColor = activeTeam === 'A' ? 'shadow-[0_0_50px_rgba(255,0,110,0.5)]' : 'shadow-[0_0_50px_rgba(176,38,255,0.5)]';
  
  return (
    <div className="flex-1 flex flex-col justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="space-y-3">
        <p className="text-[#00d4ff] font-bold tracking-[0.28em] uppercase text-xs">Match Finished</p>
        <h1 className="text-5xl font-black tracking-tight text-white">Game Over</h1>
      </div>
  
      <div className={`py-8 px-4 rounded-3xl bg-white/5 border border-white/10 ${glowColor}`}>
        <p className="text-zinc-400 uppercase font-black text-sm tracking-widest mb-2">Champion</p>
        <h2 className={`text-5xl font-black ${winnerColor}`}>
          {winnerName}
        </h2>
      </div>
  
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={onPlayAgain}
          className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-black text-lg hover:bg-[#ffe66d] transition-colors active:scale-95"
        >
          <span>PLAY AGAIN</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20" height="20"
            viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
            className="group-hover:rotate-180 transition-transform duration-500"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>
  
        <button
          onClick={onBackToChoose}
          className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest underline underline-offset-8 decoration-[#ffe66d]/30 hover:decoration-[#ffe66d] transition-all"
        >
          Back to Song Select
        </button>
      </div>
    </div>
  );
}
