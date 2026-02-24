import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameBoard } from '@/components/GameBoard';

const baseProps = {
  trialDurations: [1, 2, 3, 5, 10, 30],
  track: {
    id: 1,
    title: 'J.B.Y.',
    preview: 'https://cdn.example.com/preview.mp3',
    artist: { name: 'David August' },
    album: { cover_medium: 'https://cdn.example.com/cover.jpg' }
  },
  onPlayChunk: vi.fn(),
  onPauseChunk: vi.fn(),
  onResumeChunk: vi.fn(),
  onMaxIncorrect: vi.fn(),
  onSelectAnotherSong: vi.fn(),
  audioMeter: 0.2,
  audioBands: Array.from({ length: 12 }, (_, idx) => idx / 12),
  isAudioPlaying: false
};

describe('GameBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('plays selected chunk when a chunk button is clicked', () => {
    render(<GameBoard {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: '10s' }));
    expect(baseProps.onPlayChunk).toHaveBeenCalledWith(10);
  });

  it('chevron forward autoplays the next chunk', () => {
    render(<GameBoard {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Forward one chunk/i }));
    expect(baseProps.onPlayChunk).toHaveBeenCalledWith(2);
  });

  it('center control toggles play -> pause -> resume', () => {
    render(<GameBoard {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Play 1 second clip/i }));
    expect(baseProps.onPlayChunk).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: /Pause 1 second clip/i }));
    expect(baseProps.onPauseChunk).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Resume 1 second clip/i }));
    expect(baseProps.onResumeChunk).toHaveBeenCalledTimes(1);
  });

  it('keeps artwork sharp and toggles song panel reveal state', () => {
    render(<GameBoard {...baseProps} />);

    const revealButton = screen.getByRole('button', { name: /Reveal song details/i });
    expect(revealButton.className).toContain('top-1/2');
    expect(revealButton.className).toContain('-translate-y-1/2');

    const artwork = screen.getByAltText(/artwork/i);
    expect(artwork.getAttribute('class')).toContain('object-cover');
    expect(artwork.getAttribute('class')).not.toContain('blur');

    fireEvent.click(revealButton);
    screen.getByRole('button', { name: /Hide song details/i });

    fireEvent.click(screen.getByRole('button', { name: /Toggle track detail blur/i }));
    screen.getByRole('button', { name: /Reveal song details/i });

    fireEvent.click(screen.getByRole('button', { name: /Toggle track detail blur/i }));
    screen.getByRole('button', { name: /Hide song details/i });
  });

  it('fires choose another song action', () => {
    render(<GameBoard {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /CHOOSE ANOTHER SONG/i }));
    expect(baseProps.onSelectAnotherSong).toHaveBeenCalledTimes(1);
  });

  it('plays 30 second clip when guess is marked correct', () => {
    render(<GameBoard {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Guess Correct/i }));
    expect(baseProps.onPlayChunk).toHaveBeenCalledWith(30);
    screen.getByRole('button', { name: /Hide song details/i });
    screen.getByText(/They guessed correctly!/i);
  });

  it('auto-advances only after full clip ends and brief delay', () => {
    vi.useFakeTimers();
    render(<GameBoard {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Guess Correct/i }));
    act(() => {
      vi.advanceTimersByTime(1250);
    });
    expect(baseProps.onSelectAnotherSong).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(baseProps.onSelectAnotherSong).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(649);
    });
    expect(baseProps.onSelectAnotherSong).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(baseProps.onSelectAnotherSong).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('increments selected chunk when guess is marked incorrect', () => {
    render(<GameBoard {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Incorrect/i }));
    screen.getByRole('button', { name: /Play 2 second clip/i });
  });

  it('fires max incorrect callback on last chunk', () => {
    render(<GameBoard {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: '30s' }));
    fireEvent.click(screen.getByRole('button', { name: /Incorrect/i }));

    expect(baseProps.onMaxIncorrect).toHaveBeenCalledTimes(1);
  });
});
