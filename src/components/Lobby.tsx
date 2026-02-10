// src/components/Lobby.tsx

interface LobbyProps {
    onStart: () => void;
  }
  
  export function Lobby({ onStart }: LobbyProps) {
    return (
      <div className="flex-1 flex flex-col justify-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <p className="text-[#ffe66d] font-bold tracking-[0.2em] uppercase text-sm">
            The ultimate music showdown
          </p>
          <div className="h-1 w-12 bg-gradient-to-r from-[#b026ff] to-[#ff006e] mx-auto rounded-full" />
        </div>
  
        <button
          onClick={onStart}
          className="group relative bg-gradient-to-r from-[#b026ff] to-[#ff006e] text-white font-black py-5 rounded-full text-2xl shadow-[0_0_30px_rgba(176,38,255,0.4)] hover:shadow-[0_0_50px_rgba(255,0,110,0.6)] transition-all active:scale-95 overflow-hidden"
        >
          <span className="relative z-10">NEW GAME</span>
          
          {/* Subtle hover shine effect */}
          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent突破to-white/20 opacity-40 group-hover:animate-shine" />
        </button>
  
        <div className="flex justify-center gap-8 text-zinc-500 text-xs font-bold tracking-widest uppercase">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse" /> 
            Multiplayer
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff006e] animate-pulse" /> 
            30s Clips
          </span>
        </div>
      </div>
    );
  }