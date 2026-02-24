import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameLogic } from '@/hooks/useGameLogic';

class MockAudio {
  src: string;
  paused = true;
  private listeners: Record<string, Array<() => void>> = {};

  constructor(src: string) {
    this.src = src;
  }

  addEventListener(event: string, callback: () => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]?.push(callback);
  }

  play() {
    this.paused = false;
    this.listeners.play?.forEach((callback) => callback());
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this.listeners.pause?.forEach((callback) => callback());
  }
}

const makeTrack = () => ({
  id: 1,
  title: 'Mi Mujer',
  preview: 'https://cdn.example.com/preview.mp3',
  artist: { name: 'Nicolas Jaar' },
  album: { cover_medium: 'https://cdn.example.com/cover.jpg' }
});

describe('useGameLogic', () => {
  beforeEach(() => {
    vi.stubGlobal('Audio', MockAudio);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(128000 * 30)
    })));
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn()
    });
  });

  it('moves to GUESSING and stores the selected track on confirmSong', () => {
    const { result } = renderHook(() => useGameLogic());
    const track = makeTrack();

    act(() => {
      result.current.confirmSong(track);
    });

    expect(result.current.step).toBe('GUESSING');
    expect(result.current.targetTrack).toEqual(track);
    expect(result.current.searchQuery).toBe('');
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.trialIdx).toBe(0);
  });

  it('selectAnotherSong flips team and returns to choose flow', () => {
    const { result } = renderHook(() => useGameLogic());
    const track = makeTrack();

    act(() => {
      result.current.confirmSong(track);
      result.current.selectAnotherSong();
    });

    expect(result.current.step).toBe('DJ_CHOOSE');
    expect(result.current.targetTrack).toBeNull();
    expect(result.current.trialIdx).toBe(0);
    expect(result.current.activeTeam).toBe('B');
  });

  it('resetGame restores initial state', () => {
    const { result } = renderHook(() => useGameLogic());
    const track = makeTrack();

    act(() => {
      result.current.confirmSong(track);
      result.current.setSearchQuery('abc');
      result.current.resetGame();
    });

    expect(result.current.step).toBe('LOBBY');
    expect(result.current.activeTeam).toBe('A');
    expect(result.current.balanceA).toBe(30);
    expect(result.current.balanceB).toBe(30);
    expect(result.current.targetTrack).toBeNull();
    expect(result.current.searchQuery).toBe('');
    expect(result.current.searchResults).toEqual([]);
  });

  it('fetches preview once per selected song and reuses cached buffer for chunk plays', async () => {
    const { result } = renderHook(() => useGameLogic());
    const track = makeTrack();
    const fetchMock = vi.mocked(fetch);

    act(() => {
      result.current.confirmSong(track);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.playClipAtDuration(1);
      await result.current.playClipAtDuration(5);
      await result.current.playClipAtDuration(10);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
