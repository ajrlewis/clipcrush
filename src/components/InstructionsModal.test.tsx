import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InstructionsModal } from '@/components/InstructionsModal';

describe('InstructionsModal', () => {
  it('closes when clicking outside the modal content', () => {
    const onClose = vi.fn();
    const { container } = render(<InstructionsModal onClose={onClose} />);

    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside modal content', () => {
    const onClose = vi.fn();
    render(<InstructionsModal onClose={onClose} />);

    fireEvent.click(screen.getByText(/How to play/i));
    expect(onClose).not.toHaveBeenCalled();
  });
});
