import { useEffect, useRef, useState } from 'react';
import { searchTracks, DeezerTrack } from '@/lib/services/deezer';

const TRIALS = [
  { duration: 1, penalty: 0, reward: 2 },
  { duration: 2, penalty: 2, reward: 0 },
  { duration: 3, penalty: 3, reward: 0 },
  { duration: 5, penalty: 5, reward: 0 },
  { duration: 10, penalty: 10, reward: 0 },
  { duration: 30, penalty: 25, reward: 0 }
];

const MAX_PENALTY = TRIALS[TRIALS.length - 1]?.penalty ?? 0;
const FULL_PREVIEW_SECONDS = TRIALS[TRIALS.length - 1]?.duration ?? 30;
const SHORT_CLIP_PADDING_SECONDS = 0.25;

export type Step = 'DJ_CHOOSE' | 'SONG_RESULTS' | 'GUESSING' | 'GAME_OVER';

export function useGameLogic() {
  const [step, setStep] = useState<Step>('DJ_CHOOSE');
  const [activeTeam, setActiveTeam] = useState<'A' | 'B'>('A');
  const [balanceA, setBalanceA] = useState(30);
  const [balanceB, setBalanceB] = useState(30);
  const [targetTrack, setTargetTrack] = useState<DeezerTrack | null>(null);

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
  const graphAudioRef = useRef<HTMLAudioElement | null>(null);
  const meterFrameRef = useRef<number | null>(null);
  const clipWatchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clipEndTimeRef = useRef<number | null>(null);
  const preparedPreviewUrlRef = useRef<string | null>(null);
  const playRequestIdRef = useRef(0);
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

  const clearClipWatcher = () => {
    if (!clipWatchIntervalRef.current) return;
    clearInterval(clipWatchIntervalRef.current);
    clipWatchIntervalRef.current = null;
  };

  const stopAtClipBoundary = (audio: HTMLAudioElement) => {
    if (audioRef.current !== audio) return;
    clipEndTimeRef.current = null;
    clearClipWatcher();
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      // Ignore currentTime assignment issues when media is not seekable yet.
    }
  };

  const startClipWatcher = (audio: HTMLAudioElement) => {
    clearClipWatcher();
    clipWatchIntervalRef.current = setInterval(() => {
      if (audioRef.current !== audio) {
        clearClipWatcher();
        return;
      }

      const clipEndTime = clipEndTimeRef.current;
      if (clipEndTime === null) {
        clearClipWatcher();
        return;
      }

      if (audio.currentTime >= clipEndTime) {
        stopAtClipBoundary(audio);
      }
    }, 25);
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

      setAudioBands((prev) =>
        nextBands.map((value, idx) => {
          const prevValue = prev[idx] ?? 0;
          return prevValue * 0.58 + value * 0.42;
        })
      );
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
    graphAudioRef.current = null;
    stopMeterLoop();
    setIsAudioPlaying(false);
  };

  const setupAudioGraph = async (audio: HTMLAudioElement) => {
    if (typeof window === 'undefined') return;
    const ContextCtor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

    if (sourceNodeRef.current && graphAudioRef.current === audio) {
      return;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
      graphAudioRef.current = null;
    }

    const source = context.createMediaElementSource(audio);
    source.connect(analyserRef.current);
    sourceNodeRef.current = source;
    graphAudioRef.current = audio;
  };

  const stopAudio = () => {
    playRequestIdRef.current += 1;
    clipEndTimeRef.current = null;
    clearClipWatcher();
    if (audioRef.current) {
      audioRef.current.pause();
      try {
        audioRef.current.currentTime = 0;
      } catch {
        // Ignore currentTime assignment issues when media is not seekable yet.
      }
      audioRef.current.src = '';
    }
    audioRef.current = null;
    preparedPreviewUrlRef.current = null;
    revokeAudioUrl();
    clearAudioGraph();
  };

  useEffect(() => {
    return () => {
      playRequestIdRef.current += 1;
      clipEndTimeRef.current = null;
      clearClipWatcher();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      preparedPreviewUrlRef.current = null;
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      graphAudioRef.current = null;
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
    if (preparedPreviewUrlRef.current !== track.preview) {
      stopAudio();
    }
    if (previewCacheRef.current?.url !== track.preview) {
      clearPreviewCache();
    }
    setTargetTrack(track);
    setSearchResults([]);
    setSearchQuery('');
    setStep('GUESSING');
    void prepareTrackAudio(track.preview);
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

  const prepareTrackAudio = async (previewUrl: string): Promise<HTMLAudioElement | null> => {
    if (audioRef.current && preparedPreviewUrlRef.current === previewUrl) {
      await setupAudioGraph(audioRef.current);
      return audioRef.current;
    }

    const previewBuffer = await getPreviewBuffer(previewUrl);
    if (!previewBuffer) {
      return null;
    }

    if (audioRef.current && preparedPreviewUrlRef.current === previewUrl) {
      await setupAudioGraph(audioRef.current);
      return audioRef.current;
    }

    if (audioRef.current) {
      stopAudio();
    }

    const fullPreviewBlob = new Blob([previewBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(fullPreviewBlob);
    audioUrlRef.current = url;

    const nextAudio = new Audio(url);
    nextAudio.preload = 'auto';
    nextAudio.addEventListener('play', () => {
      setIsAudioPlaying(true);
      startMeterLoop();
      startClipWatcher(nextAudio);
    });
    nextAudio.addEventListener('pause', () => {
      setIsAudioPlaying(false);
      stopMeterLoop();
      clearClipWatcher();
    });
    nextAudio.addEventListener('ended', () => {
      clipEndTimeRef.current = null;
      clearClipWatcher();
      try {
        nextAudio.currentTime = 0;
      } catch {
        // Ignore currentTime assignment issues when media is not seekable yet.
      }
    });
    nextAudio.addEventListener('error', () => {
      clipEndTimeRef.current = null;
      clearClipWatcher();
    });
    nextAudio.load();
    audioRef.current = nextAudio;
    preparedPreviewUrlRef.current = previewUrl;
    await setupAudioGraph(nextAudio);
    return nextAudio;
  };

  const playTrackDuration = async (seconds: number) => {
    if (!targetTrack) return;
    const requestId = ++playRequestIdRef.current;
    setLoading(true);

    try {
      const preparedAudio = await prepareTrackAudio(targetTrack.preview);
      if (!preparedAudio) {
        return;
      }

      if (requestId !== playRequestIdRef.current || audioRef.current !== preparedAudio) {
        return;
      }

      preparedAudio.pause();
      try {
        preparedAudio.currentTime = 0;
      } catch {
        // Ignore currentTime assignment issues when media is not seekable yet.
      }

      const paddedDuration =
        seconds <= 2 ? Math.min(FULL_PREVIEW_SECONDS, seconds + SHORT_CLIP_PADDING_SECONDS) : seconds;
      clipEndTimeRef.current = paddedDuration;

      try {
        await preparedAudio.play();
      } catch (error) {
        if (requestId !== playRequestIdRef.current) {
          return;
        }
        console.error('Audio playback failed:', error);
        clipEndTimeRef.current = null;
        clearClipWatcher();
      }
    } finally {
      setLoading(false);
    }
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

  const finishRound = () => {
    stopAudio();
    clearPreviewCache();
    setActiveTeam((prev) => (prev === 'A' ? 'B' : 'A'));
    setStep('DJ_CHOOSE');
    setTargetTrack(null);
  };

  const applyDamage = (amount: number): boolean => {
    let isGameOver = false;

    if (activeTeam === 'A') {
      setBalanceA((prev) => {
        const next = prev - amount;
        if (next <= 0) {
          isGameOver = true;
          stopAudio();
          setStep('GAME_OVER');
        }
        return next;
      });
    } else {
      setBalanceB((prev) => {
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
    finishRound();
  };

  const selectAnotherSong = () => {
    finishRound();
  };

  const resetGame = () => {
    stopAudio();
    clearPreviewCache();
    setStep('DJ_CHOOSE');
    setActiveTeam('A');
    setBalanceA(30);
    setBalanceB(30);
    setTargetTrack(null);
    setSearchQuery('');
    setSearchResults([]);
    setLoading(false);
  };

  return {
    step,
    activeTeam,
    balanceA,
    balanceB,
    targetTrack,
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    audioMeter,
    audioBands,
    isAudioPlaying,
    trialDurations: TRIALS.map((trial) => trial.duration),
    selectSong,
    confirmSong,
    playClipAtDuration,
    pauseClip,
    resumeClip,
    giveUp,
    selectAnotherSong,
    resetGame
  };
}
