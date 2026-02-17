import { useState, useRef } from 'react';
import { searchTracks, getSnippet, DeezerTrack } from '@/lib/services/deezer';

// Updated to match the high-stakes README values
const TRIALS = [
  { level: 1, duration: 1, penalty: 0, reward: 2 },
  { level: 2, duration: 3, penalty: 3, reward: 0 },
  { level: 3, duration: 5, penalty: 5, reward: 0 },
  { level: 4, duration: 10, penalty: 10, reward: 0 },
  { level: 5, duration: 20, penalty: 20, reward: 0 },
  { level: 6, duration: 30, penalty: 25, reward: 0 },
];

const MAX_PENALTY = TRIALS[TRIALS.length - 1]?.penalty ?? 0;

export type Step = 'LOBBY' | 'START_SCREEN' | 'DJ_CHOOSE' | 'SONG_RESULTS' | 'GUESSING' | 'GAME_OVER';

export function useGameLogic() {
  const [step, setStep] = useState<Step>('LOBBY');
  const [activeTeam, setActiveTeam] = useState<'A' | 'B'>('A');
  const [balanceA, setBalanceA] = useState(30);
  const [balanceB, setBalanceB] = useState(30);
  const [trialIdx, setTrialIdx] = useState(0);
  const [targetTrack, setTargetTrack] = useState<DeezerTrack | null>(null);
  
  // Strategy: One skip per game per team
  const [hasSkippedA, setHasSkippedA] = useState(false);
  const [hasSkippedB, setHasSkippedB] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DeezerTrack[]>([]);
  const [loading, setLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const tracks = await searchTracks(searchQuery);
      setSearchResults(tracks);
      setStep('SONG_RESULTS');
    } finally {
      setLoading(false);
    }
  };

  const confirmSong = (track: DeezerTrack) => {
    setTargetTrack(track);
    setSearchResults([]);
    setSearchQuery('');
    setTrialIdx(0);
    setStep('GUESSING');
  };

  const backToSearch = () => {
    setStep('DJ_CHOOSE');
  };

  // SOUL: Frictionless Play - Using native Audio for faster response
  const playClip = async () => {
    if (!targetTrack) return;
    setLoading(true);
    
    const currentTrial = TRIALS[trialIdx];
    const blob = await getSnippet(targetTrack.preview, currentTrial.duration);
    
    if (blob) {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src); // Cleanup memory
      }
      const url = URL.createObjectURL(blob);
      audioRef.current = new Audio(url);
      audioRef.current.play();
    }
    setLoading(false);
  };

  const handleVerbalResult = (isCorrect: boolean) => {
    const currentTrial = TRIALS[trialIdx];
    
    if (isCorrect) {
      // Reward logic: +2 for 1-second ID, capped at 30
      if (activeTeam === 'A') setBalanceA(prev => Math.min(30, prev + currentTrial.reward));
      else setBalanceB(prev => Math.min(30, prev + currentTrial.reward));
      endTurn();
    } else {
      // Penalty logic
      const penalty = currentTrial.penalty;
      const isGameOver = applyDamage(penalty);

      if (isGameOver) {
        return;
      }

      if (trialIdx < TRIALS.length - 1) {
        setTrialIdx(prev => prev + 1);
      } else {
        // Failed final trial (30s)
        endTurn();
      }
    }
  };

  const useSkip = () => {
    const canSkip = activeTeam === 'A' ? !hasSkippedA : !hasSkippedB;
    if (!canSkip) return;

    if (activeTeam === 'A') setHasSkippedA(true);
    else setHasSkippedB(true);

    const isGameOver = applyDamage(5); // Flat -5 penalty for skip
    if (isGameOver) {
      return;
    }

    endTurn();
  };

  const applyDamage = (amount: number): boolean => {
    let isGameOver = false;

    if (activeTeam === 'A') {
      setBalanceA(prev => {
        const next = prev - amount;
        if (next <= 0) {
          isGameOver = true;
          setStep('GAME_OVER');
        }
        return next;
      });
    } else {
      setBalanceB(prev => {
        const next = prev - amount;
        if (next <= 0) {
          isGameOver = true;
          setStep('GAME_OVER');
        }
        return next;
      });
    }

    return isGameOver;
  };

  const giveUp = () => {
    const isGameOver = applyDamage(MAX_PENALTY);
    if (isGameOver) {
      return;
    }
    endTurn();
  };

  const endTurn = () => {
    setActiveTeam(prev => (prev === 'A' ? 'B' : 'A'));
    setStep('START_SCREEN');
    setTrialIdx(0);
    setTargetTrack(null);
  };

  return {
    step, setStep,
    activeTeam,
    balanceA, balanceB,
    trialIdx,
    searchQuery, setSearchQuery,
    searchResults,
    loading,
    canSkip: activeTeam === 'A' ? !hasSkippedA : !hasSkippedB,
    currentTrial: TRIALS[trialIdx],
    maxPenalty: MAX_PENALTY,
    selectSong, confirmSong, backToSearch, playClip, handleVerbalResult, useSkip, giveUp
  };
}