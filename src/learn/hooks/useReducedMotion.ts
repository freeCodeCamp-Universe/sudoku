import { useEffect, useState } from 'react';
import {
  ANIMATIONS_PREFERENCE_EVENT,
  ANIMATIONS_STORAGE_KEY,
  REDUCED_MOTION_ATTRIBUTE,
} from '@/learn/hooks/useAnimationsPreference';

function osPrefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function userDisabledAnimations(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(ANIMATIONS_STORAGE_KEY) === 'false';
  } catch {
    return false;
  }
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => osPrefersReducedMotion() || userDisabledAnimations()
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReduced(osPrefersReducedMotion() || userDisabledAnimations());
    };

    mq.addEventListener('change', update);
    window.addEventListener(ANIMATIONS_PREFERENCE_EVENT, update);

    return () => {
      mq.removeEventListener('change', update);
      window.removeEventListener(ANIMATIONS_PREFERENCE_EVENT, update);
    };
  }, []);

  return reduced;
}

export { REDUCED_MOTION_ATTRIBUTE };
