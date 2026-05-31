import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

export const PREVIEW_CANVAS_SIZE = 117;

export interface PreviewCanvasSize {
  width: number;
  height: number;
}

type PreviewCanvasDraw = (ctx: CanvasRenderingContext2D, size: PreviewCanvasSize) => void;

function roundCanvasSize(width: number, height: number): PreviewCanvasSize {
  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

export function usePreviewCanvas(draw: PreviewCanvasDraw) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef(draw);
  const hasMountedRef = useRef(false);

  useLayoutEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  const paint = useCallback((nextSize?: PreviewCanvasSize) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const size = nextSize ?? roundCanvasSize(
      canvas.getBoundingClientRect().width,
      canvas.getBoundingClientRect().height
    );

    if (size.width <= 0 || size.height <= 0) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(size.width * dpr);
    canvas.height = Math.round(size.height * dpr);

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);
    drawRef.current(ctx, size);
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    paint();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];

        if (!entry) {
          return;
        }

        paint(roundCanvasSize(entry.contentRect.width, entry.contentRect.height));
      });

      observer.observe(canvas);

      return () => {
        observer.disconnect();
      };
    }

    const handleResize = () => {
      paint();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [paint]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    paint();
  }, [draw, paint]);

  return canvasRef;
}
