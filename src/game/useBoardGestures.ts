import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { BoardViewport } from './useBoardViewport';

interface Pointer {
  x: number;
  y: number;
}

export function useBoardGestures(viewport: BoardViewport) {
  const pointers = useRef(new Map<number, Pointer>());
  const lastPan = useRef<Pointer | null>(null);
  const lastPinchDistance = useRef<number | null>(null);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      lastPan.current = { x: e.clientX, y: e.clientY };
    } else {
      lastPan.current = null;
      lastPinchDistance.current = null;
    }
  }, []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!pointers.current.has(e.pointerId)) {
        return;
      }
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const points = [...pointers.current.values()];

      if (points.length === 1 && lastPan.current) {
        const dx = e.clientX - lastPan.current.x;
        const dy = e.clientY - lastPan.current.y;
        lastPan.current = { x: e.clientX, y: e.clientY };
        viewport.panBy(dx, dy);
        return;
      }

      if (points.length >= 2) {
        const [a, b] = points;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const midpoint = {
          x: (a.x + b.x) / 2 - rect.left,
          y: (a.y + b.y) / 2 - rect.top,
        };
        if (lastPinchDistance.current) {
          viewport.zoomBy(distance / lastPinchDistance.current, midpoint);
        }
        lastPinchDistance.current = distance;
      }
    },
    [viewport]
  );

  const onPointerUp = useCallback((e: ReactPointerEvent) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    pointers.current.delete(e.pointerId);
    lastPan.current = null;
    lastPinchDistance.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}
