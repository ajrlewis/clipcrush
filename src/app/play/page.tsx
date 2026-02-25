'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameBoard } from '@/components/GameBoard';
import { GameOver } from '@/components/GameOver';
import { AppTopBar } from '@/components/AppTopBar';
import { InstructionsModal } from '@/components/InstructionsModal';
import { DonateBitcoinModal } from '@/components/DonateBitcoinModal';
import { PrivacyModal } from '@/components/PrivacyModal';
import { useCookieConsent } from '@/context/CookieConsentContext';
import { useGame } from '@/context/GameContext';

export default function PlayPage() {
  const router = useRouter();
  const { openBanner } = useCookieConsent();
  const [showInstructions, setShowInstructions] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const {
    step,
    resetGame,
    activeTeam,
    targetTrack,
    audioMeter,
    audioBands,
    isAudioPlaying,
    trialDurations,
    playClipAtDuration,
    pauseClip,
    resumeClip,
    giveUp,
    selectAnotherSong
  } = useGame();

  useEffect(() => {
    const inPlayFlow = step === 'GUESSING' || step === 'GAME_OVER';
    if (!inPlayFlow) {
      router.replace('/choose');
      return;
    }

    if (step === 'GUESSING' && !targetTrack) {
      router.replace('/choose');
    }
  }, [step, targetTrack, router]);

  const handleSelectAnotherSong = () => {
    selectAnotherSong();
    router.push('/choose');
  };

  const handleMaxIncorrect = () => {
    giveUp();
  };

  const handlePlayAgain = () => {
    resetGame();
    router.push('/choose');
  };

  const handleBackToChoose = () => {
    resetGame();
    router.push('/choose');
  };

  if (step !== 'GUESSING' && step !== 'GAME_OVER') {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col font-sans select-none">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1 gap-4">
        <AppTopBar
          onOpenInfo={() => setShowInstructions(true)}
          onOpenDonate={() => setShowDonateModal(true)}
        />

        {step === 'GUESSING' && (
          <GameBoard
            track={targetTrack}
            trialDurations={trialDurations}
            onPlayChunk={playClipAtDuration}
            onPauseChunk={pauseClip}
            onResumeChunk={resumeClip}
            onMaxIncorrect={handleMaxIncorrect}
            onSelectAnotherSong={handleSelectAnotherSong}
            audioMeter={audioMeter}
            audioBands={audioBands}
            isAudioPlaying={isAudioPlaying}
          />
        )}

        {step === 'GAME_OVER' && (
          <GameOver
            activeTeam={activeTeam}
            onPlayAgain={handlePlayAgain}
            onBackToChoose={handleBackToChoose}
          />
        )}
      </div>

      <footer className="w-full max-w-md mx-auto mt-6 pb-1 text-center">
        <button
          type="button"
          onClick={() => setShowPrivacyModal(true)}
          className="text-[11px] uppercase tracking-[0.14em] text-zinc-400 hover:text-[#00d4ff] transition-colors"
        >
          Privacy & Cookies
        </button>
      </footer>

      {showInstructions && <InstructionsModal onClose={() => setShowInstructions(false)} />}
      {showDonateModal && <DonateBitcoinModal onClose={() => setShowDonateModal(false)} />}
      {showPrivacyModal && (
        <PrivacyModal
          onClose={() => setShowPrivacyModal(false)}
          onOpenCookieSettings={() => {
            setShowPrivacyModal(false);
            openBanner();
          }}
        />
      )}
    </main>
  );
}
