import { useEffect, useState, useRef } from 'react';
import { searchTracks, DeezerTrack } from '@/lib/services/deezer';

// Updated to match the high-stakes README values
const TRIALS = [
  { level: 1, duration: 1, penalty: 0, reward: 2 },
  { level: 2, duration: 2, penalty: 2, reward: 0 },
  { level: 3, duration: 3, penalty: 3, reward: 0 },
  { level: 4, duration: 5, penalty: 5, reward: 0 },
  { level: 5, duration: 10, penalty: 10, reward: 0 },
  { level: 6, duration: 30, penalty: 25, reward: 0 },
];

const MAX_PENALTY = TRIALS[TRIALS.length - 1]?.penalty ?? 0;
const FULL_CLIP_DURATION = TRIALS[TRIALS.length - 1]?.duration ?? 30;
const PREVIEW_BITRATE = 128000;

export type Step = 'LOBBY' | 'START_SCREEN' | 'DJ_CHOOSE' | 'SONG_RESULTS' | 'GUESSING' | 'ROUND_REVEAL' | 'GAME_OVER';

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
  const [audioMeter, setAudioMeter] = useState(0);
  const [audioBands, setAudioBands] = useState<number[]>(Array.from({ length: 12 }, () => 0));
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const previewCacheRef = useRef<{ url: string; buffer: ArrayBuffer } | null>(null);
  const previewFetchRef = useRef<{ url: string; promise: Promise<ArrayBuffer | null> } | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const meterFrameRef = useRef<number | null>(null);
  const bandBaselineRef = useRef<number[]>(Array.from({ length: 12 }, () => 0));
  const prevSpectrumRef = useRef<Float32Array | null>(null);
  const energyBaselineRef = useRef(0);

  const revokeAudioUrl = () => {
    if (!audioUrlRef.current) return;
    URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
  };

  const clearPreviewCache = () => {
    previewCacheRef.current = null;
    previewFetchRef.current = null;
  };

  const stopMeterLoop = () => {
    if (meterFrameRef.current !== null) {
      cancelAnimationFrame(meterFrameRef.current);
      meterFrameRef.current = null;
    }
    setAudioMeter(0);
    setAudioBands(Array.from({ length: 12 }, () => 0));
    bandBaselineRef.current = Array.from({ length: 12 }, () => 0);
    prevSpectrumRef.current = null;
    energyBaselineRef.current = 0;
  };

  const startMeterLoop = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    prevSpectrumRef.current = new Float32Array(analyser.frequencyBinCount);

    const update = () => {
      analyser.getByteFrequencyData(data);

      // Focus on low-mid and high-mid bins where transients are often more pronounced.
      const rangeStart = Math.max(2, Math.floor(data.length * 0.04));
      const rangeEnd = Math.min(data.length, Math.floor(data.length * 0.45));
      const rangeSize = Math.max(1, rangeEnd - rangeStart);

      let energySum = 0;
      let fluxSum = 0;
      for (let i = rangeStart; i < rangeEnd; i += 1) {
        const current = (data[i] ?? 0) / 255;
        const prev = prevSpectrumRef.current?.[i] ?? 0;
        energySum += current;
        fluxSum += Math.max(0, current - prev);
        if (prevSpectrumRef.current) {
          prevSpectrumRef.current[i] = current;
        }
      }

      const energy = energySum / rangeSize;
      const flux = fluxSum / rangeSize;
      energyBaselineRef.current = energyBaselineRef.current * 0.92 + energy * 0.08;
      const onset = Math.max(0, (energy - energyBaselineRef.current) * 2.4 + flux * 3.2);
      const meterValue = Math.min(1, onset);

      const bandsCount = 12;
      const binsPerBand = Math.max(1, Math.floor(rangeSize / bandsCount));
      const nextBands: number[] = [];

      for (let bandIdx = 0; bandIdx < bandsCount; bandIdx += 1) {
        const start = rangeStart + bandIdx * binsPerBand;
        const end = Math.min(rangeEnd, start + binsPerBand);
        let sum = 0;
        for (let bin = start; bin < end; bin += 1) {
          sum += data[bin] ?? 0;
        }
        const avg = end > start ? sum / (end - start) : 0;
        const normalized = avg / 255;
        const baseline = bandBaselineRef.current[bandIdx] ?? 0;
        const nextBaseline = baseline * 0.94 + normalized * 0.06;
        bandBaselineRef.current[bandIdx] = nextBaseline;
        const bandOnset = Math.max(0, (normalized - nextBaseline) * 5.5);
        nextBands.push(Math.min(1, bandOnset));
      }

      setAudioBands((prev) => nextBands.map((value, idx) => {
        const prevValue = prev[idx] ?? 0;
        return prevValue * 0.58 + value * 0.42;
      }));
      setAudioMeter((prev) => prev * 0.62 + meterValue * 0.38);
      meterFrameRef.current = requestAnimationFrame(update);
    };

    stopMeterLoop();
    meterFrameRef.current = requestAnimationFrame(update);
  };

  const clearAudioGraph = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    stopMeterLoop();
    setIsAudioPlaying(false);
  };

  const setupAudioGraph = async (audio: HTMLAudioElement) => {
    if (typeof window === 'undefined') return;
    const ContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ContextCtor) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new ContextCtor();
    }

    const context = audioContextRef.current;
    if (context.state === 'suspended') {
      await context.resume();
    }

    if (!analyserRef.current) {
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.2;
      analyser.connect(context.destination);
      analyserRef.current = analyser;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    const source = context.createMediaElementSource(audio);
    source.connect(analyserRef.current);
    sourceNodeRef.current = source;
  };

  const stopAudio = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current = null;
    revokeAudioUrl();
    clearAudioGraph();
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (meterFrameRef.current !== null) {
        cancelAnimationFrame(meterFrameRef.current);
        meterFrameRef.current = null;
      }
      setAudioMeter(0);
      setAudioBands(Array.from({ length: 12 }, () => 0));
      setIsAudioPlaying(false);
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
      previewCacheRef.current = null;
      previewFetchRef.current = null;
    };
  }, []);

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
    if (previewCacheRef.current?.url !== track.preview) {
      clearPreviewCache();
    }
    setTargetTrack(track);
    setSearchResults([]);
    setSearchQuery('');
    setTrialIdx(0);
    setStep('GUESSING');
    void getPreviewBuffer(track.preview);
  };

  const backToSearch = () => {
    setStep('DJ_CHOOSE');
  };

  const getPreviewBuffer = async (previewUrl: string): Promise<ArrayBuffer | null> => {
    const cached = previewCacheRef.current;
    if (cached?.url === previewUrl) {
      return cached.buffer;
    }

    const inFlight = previewFetchRef.current;
    if (inFlight?.url === previewUrl) {
      return inFlight.promise;
    }

    const promise = (async () => {
      try {
        const response = await fetch(previewUrl);
        if (!response.ok) {
          throw new Error('Preview fetch failed');
        }

        const buffer = await response.arrayBuffer();
        previewCacheRef.current = { url: previewUrl, buffer };
        return buffer;
      } catch (error) {
        console.error('Error fetching preview buffer:', error);
        return null;
      } finally {
        if (previewFetchRef.current?.url === previewUrl) {
          previewFetchRef.current = null;
        }
      }
    })();

    previewFetchRef.current = { url: previewUrl, promise };
    return promise;
  };

  const createSnippetBlob = (buffer: ArrayBuffer, seconds: number): Blob => {
    const bytesPerSecond = PREVIEW_BITRATE / 8;
    const endByte = Math.min(buffer.byteLength, Math.ceil(seconds * bytesPerSecond));
    return new Blob([buffer.slice(0, endByte)], { type: 'audio/mpeg' });
  };

  // SOUL: Frictionless Play - Using native Audio for faster response
  const playTrackDuration = async (seconds: number) => {
    if (!targetTrack) return;
    setLoading(true);

    try {
      const previewBuffer = await getPreviewBuffer(targetTrack.preview);
      if (!previewBuffer) {
        return;
      }

      const blob = createSnippetBlob(previewBuffer, seconds);
      stopAudio();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const nextAudio = new Audio(url);
      audioRef.current = nextAudio;

      await setupAudioGraph(nextAudio);

      const releaseIfCurrent = () => {
        if (audioRef.current !== nextAudio) return;
        audioRef.current = null;
        revokeAudioUrl();
        clearAudioGraph();
      };

      nextAudio.addEventListener('ended', releaseIfCurrent, { once: true });
      nextAudio.addEventListener('error', releaseIfCurrent, { once: true });
      nextAudio.addEventListener('play', () => {
        setIsAudioPlaying(true);
        startMeterLoop();
      });
      nextAudio.addEventListener('pause', () => {
        setIsAudioPlaying(false);
        stopMeterLoop();
      });

      try {
        await nextAudio.play();
      } catch (error) {
        console.error('Audio playback failed:', error);
        releaseIfCurrent();
      }
    } finally {
      setLoading(false);
    }
  };

  const playClip = async () => {
    const currentTrial = TRIALS[trialIdx];
    await playTrackDuration(currentTrial.duration);
  };

  const playClipAtDuration = async (seconds: number) => {
    await playTrackDuration(seconds);
  };

  const pauseClip = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  };

  const resumeClip = () => {
    if (!audioRef.current) return;
    if (!audioRef.current.paused) return;
    void audioRef.current.play();
  };

  const playFullClip = async () => {
    await playTrackDuration(FULL_CLIP_DURATION);
  };

  const finishRound = (nextStep: Step) => {
    stopAudio();
    clearPreviewCache();
    setActiveTeam(prev => (prev === 'A' ? 'B' : 'A'));
    setStep(nextStep);
    setTrialIdx(0);
    setTargetTrack(null);
  };

  const handleVerbalResult = (isCorrect: boolean) => {
    const currentTrial = TRIALS[trialIdx];
    
    if (isCorrect) {
      // Reward logic: +2 for 1-second ID, capped at 30
      if (activeTeam === 'A') setBalanceA(prev => Math.min(30, prev + currentTrial.reward));
      else setBalanceB(prev => Math.min(30, prev + currentTrial.reward));
      setStep('ROUND_REVEAL');
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
          stopAudio();
          setStep('GAME_OVER');
        }
        return next;
      });
    } else {
      setBalanceB(prev => {
        const next = prev - amount;
        if (next <= 0) {
          isGameOver = true;
          stopAudio();
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
    setStep('ROUND_REVEAL');
  };

  const endTurn = () => {
    finishRound('START_SCREEN');
  };

  const selectAnotherSong = () => {
    finishRound('DJ_CHOOSE');
  };

  const resetGame = () => {
    stopAudio();
    clearPreviewCache();
    setStep('LOBBY');
    setActiveTeam('A');
    setBalanceA(30);
    setBalanceB(30);
    setTrialIdx(0);
    setTargetTrack(null);
    setHasSkippedA(false);
    setHasSkippedB(false);
    setSearchQuery('');
    setSearchResults([]);
    setLoading(false);
  };

  return {
    step, setStep,
    activeTeam,
    balanceA, balanceB,
    targetTrack,
    trialIdx,
    searchQuery, setSearchQuery,
    searchResults,
    loading,
    audioMeter,
    audioBands,
    isAudioPlaying,
    canSkip: activeTeam === 'A' ? !hasSkippedA : !hasSkippedB,
    currentTrial: TRIALS[trialIdx],
    trialDurations: TRIALS.map((trial) => trial.duration),
    maxPenalty: MAX_PENALTY,
    selectSong, confirmSong, backToSearch,
    playClip, playClipAtDuration, pauseClip, resumeClip, playFullClip,
    handleVerbalResult, useSkip, giveUp, selectAnotherSong, resetGame
  };
}
