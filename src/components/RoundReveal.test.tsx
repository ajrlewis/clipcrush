import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RoundReveal } from '@/components/RoundReveal';

const baseProps = {
  track: {
    id: 1,
    title: 'J.B.Y.',
    preview: 'https://cdn.example.com/preview.mp3',
    artist: { name: 'David August' },
    album: { cover_medium: 'https://cdn.example.com/cover.jpg' }
  },
  loading: false,
  onPlayFullClip: vi.fn(),
  onSelectAnotherSong: vi.fn()
};

describe('RoundReveal', () => {
  it('toggles reveal/hide control for track details', () => {
    render(<RoundReveal {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Reveal song details/i }));
    screen.getByRole('button', { name: /Hide song details/i });

    fireEvent.click(screen.getByRole('button', { name: /Hide song details/i }));
    screen.getByRole('button', { name: /Reveal song details/i });
  });

  it('wires round actions', () => {
    render(<RoundReveal {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Play full clip/i }));
    expect(baseProps.onPlayFullClip).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Select another song/i }));
    expect(baseProps.onSelectAnotherSong).toHaveBeenCalledTimes(1);
  });
});
