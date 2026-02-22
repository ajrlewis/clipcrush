'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameBoard } from '@/components/GameBoard';
import { RoundReveal } from '@/components/RoundReveal';
import { GameOver } from '@/components/GameOver';
import { AppTopBar } from '@/components/AppTopBar';
import { InstructionsModal } from '@/components/InstructionsModal';
import { useGame } from '@/context/GameContext';

export default function PlayPage() {
  const router = useRouter();
  const [showInstructions, setShowInstructions] = useState(false);
  const {
    step,
    setStep,
    resetGame,
    activeTeam,
    targetTrack,
    loading,
    audioMeter,
    audioBands,
    isAudioPlaying,
    trialDurations,
    playClipAtDuration,
    pauseClip,
    resumeClip,
    playFullClip,
    selectAnotherSong
  } = useGame();

  useEffect(() => {
    const inPlayFlow = step === 'GUESSING' || step === 'ROUND_REVEAL' || step === 'GAME_OVER';
    if (!inPlayFlow) {
      router.replace('/choose');
      return;
    }

    if ((step === 'GUESSING' || step === 'ROUND_REVEAL') && !targetTrack) {
      router.replace('/choose');
    }
  }, [step, targetTrack, router]);

  const handleSelectAnotherSong = () => {
    selectAnotherSong();
    router.push('/choose');
  };

  const handlePlayAgain = () => {
    resetGame();
    setStep('DJ_CHOOSE');
    router.push('/choose');
  };

  const handleReturnToLobby = () => {
    resetGame();
    router.push('/');
  };

  if (step !== 'GUESSING' && step !== 'ROUND_REVEAL' && step !== 'GAME_OVER') {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col font-sans select-none">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1 gap-4">
        <AppTopBar onOpenInfo={() => setShowInstructions(true)} />

        {step === 'GUESSING' && (
          <GameBoard
            track={targetTrack}
            trialDurations={trialDurations}
            onPlayChunk={playClipAtDuration}
            onPauseChunk={pauseClip}
            onResumeChunk={resumeClip}
            onSelectAnotherSong={handleSelectAnotherSong}
            audioMeter={audioMeter}
            audioBands={audioBands}
            isAudioPlaying={isAudioPlaying}
          />
        )}

        {step === 'ROUND_REVEAL' && (
          <RoundReveal
            track={targetTrack}
            loading={loading}
            onPlayFullClip={playFullClip}
            onSelectAnotherSong={handleSelectAnotherSong}
          />
        )}

        {step === 'GAME_OVER' && (
          <GameOver
            activeTeam={activeTeam}
            onPlayAgain={handlePlayAgain}
            onReturnToLobby={handleReturnToLobby}
          />
        )}
      </div>

      {showInstructions && <InstructionsModal onClose={() => setShowInstructions(false)} />}
    </main>
  );
}
