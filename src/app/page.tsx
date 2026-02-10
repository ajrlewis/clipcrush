'use client';

import Image from 'next/image';
import { useGameLogic } from '@/hooks/useGameLogic';
import { Lobby } from '@/components/Lobby';
import { StartScreen } from '@/components/StartScreen';
import { SongSelector } from '@/components/SongSelector';
import { GameBoard } from '@/components/GameBoard';
import { GameOver } from '@/components/GameOver';

export default function ClipCrush() {
  const { 
    step, setStep, activeTeam, balanceA, balanceB, 
    trialIdx, searchQuery, setSearchQuery, loading, 
    selectSong, playClip, handleVerbalResult 
  } = useGameLogic();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col font-sans select-none">
      {/* Persistent Header */}
      <div className="text-center py-8 flex flex-col items-center gap-4">
        <Image src="/logo.png" alt="Clip Crush" width={512} height={512} priority className="..." />
        <h1 className="...">Every Second Counts.</h1>
      </div>

      {/* Step Switcher */}
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

      {step === 'GUESSING' && (
        <GameBoard 
          trialIdx={trialIdx} 
          activeTeam={activeTeam} 
          onPlay={playClip} 
          onResult={handleVerbalResult} 
        />
      )}

      {step === 'GAME_OVER' && <GameOver activeTeam={activeTeam} />}
    </main>
  );
}