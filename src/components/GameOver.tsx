// src/components/GameOver.tsx

interface GameOverProps {
  activeTeam: 'A' | 'B';
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}
  
export function GameOver({ activeTeam, onPlayAgain, onReturnToLobby }: GameOverProps) {
  // Since the game ends when a team's balance hits 0, the WINNER
  // is actually the team that WASN'T the active team when the game ended.
  const winnerName = activeTeam === 'A' ? 'TEAM ECHO' : 'TEAM PULSE';
  const winnerColor = activeTeam === 'A' ? 'text-[#ff006e]' : 'text-[#b026ff]';
  const glowColor = activeTeam === 'A' ? 'shadow-[0_0_50px_rgba(255,0,110,0.5)]' : 'shadow-[0_0_50px_rgba(176,38,255,0.5)]';
  
  return (
    <div className="flex-1 flex flex-col justify-center text-center space-y-10 animate-in zoom-in duration-700">
      <div className="space-y-2">
        <h1 className="text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#ff006e] via-[#b026ff] to-[#00d4ff] drop-shadow-[0_0_30px_rgba(255,0,110,0.6)]">
          CRUSHED.
        </h1>
        <p className="text-[#ffe66d] font-bold tracking-[0.4em] uppercase text-xs">
          Game Over
        </p>
      </div>
  
      <div className={`py-8 px-4 rounded-3xl bg-white/5 border border-white/10 ${glowColor} transition-all`}>
        <p className="text-zinc-400 uppercase font-black text-sm tracking-widest mb-2">Champion</p>
        <h2 className={`text-5xl font-black ${winnerColor} drop-shadow-sm`}>
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
          onClick={onReturnToLobby}
          className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest underline underline-offset-8 decoration-[#ffe66d]/30 hover:decoration-[#ffe66d] transition-all"
        >
          Return to Lobby
        </button>
      </div>
    </div>
  );
}
