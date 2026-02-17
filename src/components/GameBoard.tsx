// src/components/GameBoard.tsx

interface GameBoardProps {
    trialIdx: number;
    activeTeam: 'A' | 'B';
    balanceA: number;
    balanceB: number;
    currentPenalty: number;
    maxPenalty: number;
    onPlay: () => void;
    onResult: (isCorrect: boolean) => void;
    onGiveUp: () => void;
  }
  
  export function GameBoard({ trialIdx, activeTeam, balanceA, balanceB, currentPenalty, maxPenalty, onPlay, onResult, onGiveUp }: GameBoardProps) {
    const currentBalance = activeTeam === 'A' ? balanceA : balanceB;
    const postWrongBalance = Math.max(0, currentBalance - currentPenalty);
  
    return (
      <div className="flex-1 flex flex-col justify-between py-10 animate-in fade-in zoom-in duration-300">
        {/* Trial Header */}
        <div className="text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-4">
            <p className="text-[#ffe66d] uppercase font-black text-[10px] tracking-[0.2em]">
              Trial {trialIdx + 1} • Risking {currentPenalty} PTS
            </p>
          </div>
          <h2 className="text-3xl font-black text-white italic">
            TEAM {activeTeam === 'A' ? 'PULSE' : 'ECHO'} <span className="text-zinc-500">GUESSING</span>
          </h2>
          <p className="mt-3 text-xs text-zinc-400 font-semibold tracking-widest uppercase">
            Total: <span className="text-white">{currentBalance} pts</span> • After wrong guess: <span className="text-[#ff006e]">{postWrongBalance} pts</span>
          </p>
        </div>
  
        {/* The Big Play Button */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#b026ff] to-[#00d4ff] rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <button 
            onClick={onPlay} 
            className="relative w-52 h-52 bg-gradient-to-br from-[#b026ff] via-[#6026ff] to-[#00d4ff] text-white rounded-full mx-auto flex items-center justify-center font-black text-4xl shadow-[0_0_50px_rgba(176,38,255,0.5)] hover:shadow-[0_0_70px_rgba(0,212,255,0.6)] active:scale-90 transition-all border-4 border-white/10"
          >
            <div className="flex flex-col items-center">
              <span>PLAY</span>
              <span className="text-[10px] tracking-widest opacity-60">LISTEN</span>
            </div>
          </button>
        </div>
  
        {/* Verdict Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onResult(false)} 
            className="group flex flex-col items-center justify-center bg-zinc-900/50 border-2 border-[#ff006e]/30 text-white py-6 rounded-3xl hover:bg-[#ff006e] hover:border-[#ff006e] transition-all"
          >
            <span className="font-black text-xl">WRONG</span>
            <span className="text-[10px] font-bold opacity-60 group-hover:opacity-100 italic">-{currentPenalty} PTS</span>
          </button>
          
          <button 
            onClick={() => onResult(true)} 
            className="group flex flex-col items-center justify-center bg-zinc-900/50 border-2 border-[#00d4ff]/30 text-white py-6 rounded-3xl hover:bg-[#00d4ff] hover:border-[#00d4ff] transition-all"
          >
            <span className="font-black text-xl">CORRECT</span>
            <span className="text-[10px] font-bold opacity-60 group-hover:opacity-100 italic">WIN TURN</span>
          </button>

          <div className="col-span-2 flex justify-center">
            <button
              onClick={onGiveUp}
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-[#ff006e] underline underline-offset-4 decoration-zinc-700 hover:decoration-[#ff006e] transition-colors mt-1"
            >
              Give up? Lose max {maxPenalty} pts &amp; pass turn
            </button>
          </div>
        </div>
      </div>
    );
  }