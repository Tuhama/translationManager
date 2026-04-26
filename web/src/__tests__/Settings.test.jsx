import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Settings from '../components/Settings';
import React from 'react';

// Mock Modal since it uses Portals
vi.mock('../components/ui/Modal', () => ({
  default: ({ children, title, footer, isOpen }) => isOpen ? (
    <div data-testid="modal">
      <h1>{title}</h1>
      <div className="modal-body">{children}</div>
      <div className="modal-footer">{footer}</div>
    </div>
  ) : null
}));

describe('Settings Component', () => {
  it('allows selecting AI provider', async () => {
    // Mock fetch for config
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        aiTranslate: { provider: 'openai' },
        googleTranslate: {}
      })
    });

    render(<Settings onClose={vi.fn()} />);

    // Wait for data to load and render
    const select = await screen.findByLabelText(/AI Provider/i);
    
    expect(select.value).toBe('openai');

    // Change to gemini
    fireEvent.change(select, { target: { value: 'gemini' } });
    
    expect(select.value).toBe('gemini');
  });
});
