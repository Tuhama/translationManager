import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from '../components/Header';
import React from 'react';

// Mock sub-components to keep it a unit test
vi.mock('../components/CleanupTool', () => ({
  default: () => <div data-testid="cleanup-tool" />
}));
vi.mock('../components/MissingKeysTool', () => ({
  default: () => <div data-testid="missing-keys-tool" />
}));

describe('Header Component', () => {
  const defaultProps = {
    onNewKey: vi.fn(),
    onNormalize: vi.fn(),
    onDeleteMultiple: vi.fn(),
    onShowSettings: vi.fn(),
    onShowAutoTranslate: vi.fn(),
    onShowExportImport: vi.fn(),
    onSelectKey: vi.fn(),
    data: {}
  };

  it('renders the application title', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Translation Manager')).toBeInTheDocument();
  });

  it('calls onNewKey when New Key button is clicked', () => {
    render(<Header {...defaultProps} />);
    fireEvent.click(screen.getByText('New Key'));
    expect(defaultProps.onNewKey).toHaveBeenCalled();
  });

  it('calls onNormalize when Normalize button is clicked', () => {
    render(<Header {...defaultProps} />);
    fireEvent.click(screen.getByText(/Normalize/i));
    expect(defaultProps.onNormalize).toHaveBeenCalled();
  });

  it('calls onShowSettings when Settings button is clicked', () => {
    render(<Header {...defaultProps} />);
    // Settings button has title="Settings"
    fireEvent.click(screen.getByTitle('Settings'));
    expect(defaultProps.onShowSettings).toHaveBeenCalled();
  });

  it('renders mock sub-components', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByTestId('cleanup-tool')).toBeInTheDocument();
    expect(screen.getByTestId('missing-keys-tool')).toBeInTheDocument();
  });

  it('calls onShowAutoTranslate when Auto-Translate is clicked in Tools dropdown', () => {
    render(<Header {...defaultProps} />);
    
    // Tools dropdown menu items are in the DOM but might be hidden by CSS
    // fireEvent.click works regardless of CSS visibility unless we use userEvent
    fireEvent.click(screen.getByText('Auto-Translate'));
    expect(defaultProps.onShowAutoTranslate).toHaveBeenCalled();
  });

  it('renders stats correctly including probable unused', () => {
    const data = {
      languages: ['en', 'es'],
      allKeys: ['a', 'b', 'c'],
      unused: ['u1'],
      maybeUsed: ['m1', 'm2']
    };
    render(<Header {...defaultProps} data={data} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Languages
    const countStats = screen.getAllByText('3');
    expect(countStats.length).toBe(2); // Keys and Probable Unused both have 3
    expect(screen.getByText('Probable Unused')).toBeInTheDocument();
  });
});
