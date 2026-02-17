'use client';

import Image from 'next/image';
import { useGameLogic } from '@/hooks/useGameLogic';
import { Lobby } from '@/components/Lobby';
import { StartScreen } from '@/components/StartScreen';
import { SongSelector } from '@/components/SongSelector';
import { SongResults } from '@/components/SongResults';
import { GameBoard } from '@/components/GameBoard';
import { GameOver } from '@/components/GameOver';

export default function ClipCrush() {
  const { 
    step, setStep, activeTeam, balanceA, balanceB, 
    trialIdx, searchQuery, setSearchQuery, searchResults, loading, 
    selectSong, confirmSong, backToSearch,
    playClip, handleVerbalResult, 
    currentTrial, maxPenalty, giveUp
  } = useGameLogic();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col font-sans select-none">
      {/* Header: full branding only on lobby; hidden once game starts to free space */}
      {step === 'LOBBY' && (
        <div className="text-center pt-8 pb-4 flex flex-col items-center">
          <Image
            src="/logo.svg"
            alt="Clip Crush"
            width={512}
            height={512}
            priority
            className="mb-[-40px] md:mb-[-60px]"
          />
          <h1 className="title m-0 p-0 leading-tight">
            SoundStake
          </h1>
          <div className="space-y-2 mt-2 pb-8">
            <p className="subtitle font-bold tracking-[0.2em] uppercase text-sm">
              High fidelity. Higher stakes.
            </p>
            <div className="h-1 w-12 bg-gradient-to-r from-[#b026ff] to-[#ff006e] mx-auto rounded-full" />
          </div>
        </div>
      )}

      {/* Step content: constrained width on desktop, full width on mobile */}
      <div className="w-full max-w-md mx-auto flex flex-col flex-1">
        {step === 'LOBBY' && <Lobby onStart={() => setStep('START_SCREEN')} />}

        {step === 'START_SCREEN' && (
          <StartScreen 
            balanceA={balanceA} 
            balanceB={balanceB} 
            activeTeam={activeTeam} 
            onStart={() => setStep('DJ_CHOOSE')} 
          />
        )}

        {step === 'DJ_CHOOSE' && (
          <SongSelector 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            onSelect={selectSong} 
            loading={loading} 
          />
        )}

        {step === 'SONG_RESULTS' && (
          <SongResults 
            results={searchResults} 
            onSelect={confirmSong} 
            onSearchAgain={backToSearch} 
          />
        )}

        {step === 'GUESSING' && (
          <GameBoard 
            trialIdx={trialIdx} 
            activeTeam={activeTeam} 
            balanceA={balanceA}
            balanceB={balanceB}
            currentPenalty={currentTrial.penalty}
            maxPenalty={maxPenalty}
            onPlay={playClip} 
            onResult={handleVerbalResult}
            onGiveUp={giveUp}
          />
        )}

        {step === 'GAME_OVER' && <GameOver activeTeam={activeTeam} />}
      </div>

      {/* Footer */}
      <footer className="py-6 flex justify-center gap-8 text-zinc-500 text-xs font-bold tracking-widest uppercase">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse" />
          Multiplayer
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ff006e] animate-pulse" />
          30s Clips
        </span>
      </footer>
    </main>
  );
}