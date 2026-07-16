export type LandscapeTabId = 'normal' | 'candidate' | 'controls' | 'move' | 'map';

export type LandscapeTabGroup = 'input' | 'nav';

export interface LandscapeTabState {
  candidateMode: boolean;
  controlsOpen: boolean;
  navTab: 'move' | 'map';
  activeGroup: LandscapeTabGroup;
}

// Portrait renders the input and nav groups at the same time, so a single
// 5-value active tab cannot round-trip rotation without losing state. Keep the
// source atoms canonical and derive the landscape tab from them instead.
export function deriveLandscapeTab(state: LandscapeTabState): LandscapeTabId {
  if (state.activeGroup === 'nav') {
    return state.navTab;
  }

  if (state.controlsOpen) {
    return 'controls';
  }

  return state.candidateMode ? 'candidate' : 'normal';
}

export function selectLandscapeTab(id: LandscapeTabId): Partial<LandscapeTabState> {
  switch (id) {
    case 'normal':
    case 'candidate':
      return {
        activeGroup: 'input',
        controlsOpen: false,
        candidateMode: id === 'candidate',
      };
    case 'controls':
      return {
        activeGroup: 'input',
        controlsOpen: true,
      };
    case 'move':
    case 'map':
      return {
        activeGroup: 'nav',
        navTab: id,
      };
  }
}
