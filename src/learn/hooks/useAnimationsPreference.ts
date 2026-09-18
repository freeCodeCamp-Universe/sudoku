import { useEffect, useState } from 'react';

export const ANIMATIONS_STORAGE_KEY = '{{PROJECT_NAME}}:animationsEnabled';
export const ANIMATIONS_PREFERENCE_EVENT = '{{PROJECT_NAME}}:animations-preference-change';
export const REDUCED_MOTION_ATTRIBUTE = 'data-reduced-motion';

function readAnimationsPreference(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return window.localStorage.getItem(ANIMATIONS_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

export interface UseAnimationsPreferenceResult {
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
}

export function useAnimationsPreference(): UseAnimationsPreferenceResult {
  const [animationsEnabled, setAnimationsEnabled] = useState(readAnimationsPreference);

  useEffect(() => {
    try {
      window.localStorage.setItem(ANIMATIONS_STORAGE_KEY, String(animationsEnabled));
    } catch {
      // Persistence is best-effort when browser storage is unavailable.
    }

    document.documentElement.toggleAttribute(REDUCED_MOTION_ATTRIBUTE, !animationsEnabled);
    window.dispatchEvent(new Event(ANIMATIONS_PREFERENCE_EVENT));
  }, [animationsEnabled]);

  return { animationsEnabled, setAnimationsEnabled };
}
