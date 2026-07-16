import { describe, expect, it } from 'vitest';
import {
  deriveLandscapeTab,
  selectLandscapeTab,
  type LandscapeTabId,
  type LandscapeTabState,
} from './landscapeTabState';

function applyLandscapeTabSelection(
  state: LandscapeTabState,
  id: LandscapeTabId
): LandscapeTabState {
  return {
    ...state,
    ...selectLandscapeTab(id),
  };
}

describe('landscapeTabState', () => {
  describe('deriveLandscapeTab', () => {
    it('should derive normal from the input group when neither candidate nor controls is active', () => {
      expect(
        deriveLandscapeTab({
          candidateMode: false,
          controlsOpen: false,
          navTab: 'move',
          activeGroup: 'input',
        })
      ).toBe('normal');
    });

    it('should derive candidate from the input group when candidate mode is active', () => {
      expect(
        deriveLandscapeTab({
          candidateMode: true,
          controlsOpen: false,
          navTab: 'move',
          activeGroup: 'input',
        })
      ).toBe('candidate');
    });

    it('should derive controls when controls are open in the input group', () => {
      expect(
        deriveLandscapeTab({
          candidateMode: false,
          controlsOpen: true,
          navTab: 'move',
          activeGroup: 'input',
        })
      ).toBe('controls');
    });

    it('should let controls win over candidate mode within the input group', () => {
      expect(
        deriveLandscapeTab({
          candidateMode: true,
          controlsOpen: true,
          navTab: 'move',
          activeGroup: 'input',
        })
      ).toBe('controls');
    });

    it('should derive move from the nav group when move is active', () => {
      expect(
        deriveLandscapeTab({
          candidateMode: true,
          controlsOpen: true,
          navTab: 'move',
          activeGroup: 'nav',
        })
      ).toBe('move');
    });

    it('should let navTab decide within the nav group', () => {
      expect(
        deriveLandscapeTab({
          candidateMode: false,
          controlsOpen: false,
          navTab: 'map',
          activeGroup: 'nav',
        })
      ).toBe('map');
    });
  });

  describe('selectLandscapeTab', () => {
    it('should write through so every selected tab derives back to itself', () => {
      const cases: Array<{ id: LandscapeTabId; state: LandscapeTabState }> = [
        {
          id: 'normal',
          state: {
            candidateMode: true,
            controlsOpen: true,
            navTab: 'map',
            activeGroup: 'nav',
          },
        },
        {
          id: 'candidate',
          state: {
            candidateMode: false,
            controlsOpen: true,
            navTab: 'move',
            activeGroup: 'nav',
          },
        },
        {
          id: 'controls',
          state: {
            candidateMode: true,
            controlsOpen: false,
            navTab: 'map',
            activeGroup: 'nav',
          },
        },
        {
          id: 'move',
          state: {
            candidateMode: true,
            controlsOpen: true,
            navTab: 'map',
            activeGroup: 'input',
          },
        },
        {
          id: 'map',
          state: {
            candidateMode: false,
            controlsOpen: false,
            navTab: 'move',
            activeGroup: 'input',
          },
        },
      ];

      for (const { id, state } of cases) {
        expect(deriveLandscapeTab(applyLandscapeTabSelection(state, id))).toBe(id);
      }
    });

    it('should keep candidateMode unchanged when selecting controls or nav tabs', () => {
      const candidateState: LandscapeTabState = {
        candidateMode: true,
        controlsOpen: false,
        navTab: 'move',
        activeGroup: 'input',
      };

      expect(applyLandscapeTabSelection(candidateState, 'controls').candidateMode).toBe(true);
      expect(applyLandscapeTabSelection(candidateState, 'move').candidateMode).toBe(true);
      expect(applyLandscapeTabSelection(candidateState, 'map').candidateMode).toBe(true);
    });

    it('should keep navTab unchanged when selecting input tabs', () => {
      const navState: LandscapeTabState = {
        candidateMode: false,
        controlsOpen: true,
        navTab: 'map',
        activeGroup: 'nav',
      };

      expect(applyLandscapeTabSelection(navState, 'normal').navTab).toBe('map');
      expect(applyLandscapeTabSelection(navState, 'candidate').navTab).toBe('map');
    });
  });

  describe('rotation round-trip', () => {
    it('should keep candidate mode when selecting map and rotating back to portrait', () => {
      const state: LandscapeTabState = {
        candidateMode: true,
        controlsOpen: false,
        navTab: 'move',
        activeGroup: 'input',
      };

      expect(applyLandscapeTabSelection(state, 'map').candidateMode).toBe(true);
    });

    it('should keep navTab when selecting normal and rotating back to portrait', () => {
      const state: LandscapeTabState = {
        candidateMode: false,
        controlsOpen: true,
        navTab: 'map',
        activeGroup: 'input',
      };

      expect(applyLandscapeTabSelection(state, 'normal').navTab).toBe('map');
    });
  });
});
