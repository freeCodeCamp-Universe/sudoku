import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortraitControls } from './PortraitControls';

const defaultProps = {
  controlTabs: [{ id: 'input', label: 'Input', panelId: 'control-panel-input' }],
  activeControlTab: 'input',
  onSelectControlTab: vi.fn(),
  inputTabLabelledBy: 'input-tab',
  controlsOpen: false,
  numberPad: null,
  controlsPanel: null,
  settingToggles: null,
  navTabs: [
    { id: 'move', label: 'Move', panelId: 'nav-panel-move' },
    { id: 'map', label: 'Map', panelId: 'nav-panel-map' },
  ],
  navTab: 'move' as const,
  onSelectNavTab: vi.fn(),
  onMoveSelection: vi.fn(),
  minimap: null,
  zoomControls: null,
};

describe('PortraitControls', () => {
  it('should render the input mode tablist', () => {
    render(<PortraitControls {...defaultProps} />);

    expect(screen.getByRole('tablist', { name: /input mode and controls/i })).toBeInTheDocument();
  });

  it('should render the board navigation tablist', () => {
    render(<PortraitControls {...defaultProps} />);

    expect(screen.getByRole('tablist', { name: /board navigation/i })).toBeInTheDocument();
  });

  it('should render the input tab panel', () => {
    render(<PortraitControls {...defaultProps} />);

    expect(screen.getByRole('tabpanel', { name: /input/i })).toBeInTheDocument();
  });

  it('should render the move and map nav tab panels', () => {
    render(<PortraitControls {...defaultProps} />);

    expect(screen.getByRole('tabpanel', { name: /move/i })).toBeInTheDocument();
    expect(screen.getByRole('tabpanel', { name: /map/i })).toBeInTheDocument();
  });
});
