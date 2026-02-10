// src/components/StartScreen.tsx

interface StartScreenProps {
    balanceA: number;
    balanceB: number;
    activeTeam: 'A' | 'B';
    onStart: () => void;
  }
  
  export function StartScreen({ balanceA, balanceB, activeTeam, onStart }: StartScreenProps) {
    const isTeamAPlaying = activeTeam === 'A';
  
    return (
      <div className="flex-1 flex flex-col justify-center space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Scoreboard Section */}
        <div className="grid grid-cols-2 gap-4">
          {/* Team Pulse (A) */}
          <div 
            className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
              isTeamAPlaying 
                ? 'bg-[#b026ff]/20 border-[#b026ff] shadow-[0_0_25px_rgba(176,38,255,0.3)] scale-105' 
                : 'bg-black/40 border-zinc-800 opacity-60'
            }`}
          >
            <p className="text-xs uppercase font-black tracking-widest text-[#ffe66d] mb-1">Team Pulse</p>
            <p className="text-4xl font-black text-white">{balanceA}</p>
            {isTeamAPlaying && (
              <div className="mt-2 text-[10px] font-bold text-[#b026ff] animate-pulse">GUESSING NEXT</div>
            )}
          </div>
  
          {/* Team Echo (B) */}
          <div 
            className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
              !isTeamAPlaying 
                ? 'bg-[#ff006e]/20 border-[#ff006e] shadow-[0_0_25px_rgba(255,0,110,0.3)] scale-105' 
                : 'bg-black/40 border-zinc-800 opacity-60'
            }`}
          >
            <p className="text-xs uppercase font-black tracking-widest text-[#ffe66d] mb-1">Team Echo</p>
            <p className="text-4xl font-black text-white">{balanceB}</p>
            {!isTeamAPlaying && (
              <div className="mt-2 text-[10px] font-bold text-[#ff006e] animate-pulse">GUESSING NEXT</div>
            )}
          </div>
        </div>
  
        {/* Action Section */}
        <div className="space-y-4">
          <p className="text-zinc-400 font-medium italic">
            Team {activeTeam === 'A' ? 'Echo' : 'Pulse'} is the DJ...
          </p>
          
          <button 
            onClick={onStart} 
            className="w-full bg-gradient-to-r from-[#00d4ff] to-[#b026ff] text-white py-6 rounded-2xl font-black text-2xl animate-pulse shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:scale-[1.02] active:scale-95 transition-transform"
          >
            START ROUND
          </button>
        </div>
  
        <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em]">
          Pass the device to the DJ
        </p>
      </div>
    );
  }