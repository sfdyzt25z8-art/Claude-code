// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

function Harness({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open trigger</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Test Modal">
        <button>First action</button>
        <button>Second action</button>
      </Modal>
    </div>
  );
}

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hidden">
        <p>content</p>
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders as an accessible dialog with the given title when open', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Visible">
        <p>content</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Visible');
  });

  it('closes when Escape is pressed', () => {
    let closed = false;
    render(
      <Modal open={true} onClose={() => (closed = true)} title="Escapable">
        <p>content</p>
      </Modal>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closed).toBe(true);
  });

  it('closes when the backdrop is clicked but not when the panel is clicked', () => {
    let closeCount = 0;
    const { container } = render(
      <Modal open={true} onClose={() => closeCount++} title="Clickable">
        <p>content</p>
      </Modal>,
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(closeCount).toBe(0);

    const backdrop = container.firstElementChild!;
    fireEvent.click(backdrop);
    expect(closeCount).toBe(1);
  });

  it('moves focus into the dialog when it opens', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('Open trigger'));
    const dialog = await screen.findByRole('dialog');
    // Focus should land on the first focusable element inside the dialog
    // (the close [X] button, which precedes the body buttons in DOM order).
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('restores focus to the trigger element after closing', async () => {
    render(<Harness />);
    const trigger = screen.getByText('Open trigger');
    trigger.focus();
    fireEvent.click(trigger);
    await screen.findByRole('dialog');

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(document.activeElement).toBe(trigger);
  });
});
