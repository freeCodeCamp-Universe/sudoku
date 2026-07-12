import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { Size } from '@/game/gameTypes';

export function useElementSize(ref: RefObject<HTMLElement | null>): Size {
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });

  useEffect(() => {
    function measure() {
      const el = ref.current;
      if (!el) {
        return;
      }
      const rect = el.getBoundingClientRect();
      setSize((prev) =>
        prev.w === rect.width && prev.h === rect.height ? prev : { w: rect.width, h: rect.height }
      );
    }
    measure();
    window.addEventListener('resize', measure);

    // Observe the element itself: its box can change without a window resize
    // (e.g. a parent toggling a size-changing class once measurement reveals
    // the board is oversized). Without this, the first measurement — taken
    // before that class applies — sticks and the reported size is wrong.
    // ResizeObserver is absent in jsdom; the window listener covers tests.
    let observer: ResizeObserver | undefined;
    if (ref.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      observer.observe(ref.current);
    }

    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [ref]);

  return size;
}
