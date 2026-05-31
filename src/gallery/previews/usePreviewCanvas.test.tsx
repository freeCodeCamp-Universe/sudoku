import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, should, vi } from 'vitest';
import { PREVIEW_CANVAS_SIZE, usePreviewCanvas } from './usePreviewCanvas';

const shouldAssert = should();

type DrawPreviewCanvas = Parameters<typeof usePreviewCanvas>[0];

function TestCanvas({ draw }: { draw: DrawPreviewCanvas }) {
  const canvasRef = usePreviewCanvas(draw);

  return (
    <canvas
      ref={canvasRef}
      data-testid="preview-canvas"
      width={PREVIEW_CANVAS_SIZE}
      height={PREVIEW_CANVAS_SIZE}
    />
  );
}

function createRect(width: number, height: number) {
  return new DOMRect(0, 0, width, height);
}

const originalDevicePixelRatio = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
const originalResizeObserver = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver');

function restoreProperty(
  target: object,
  key: PropertyKey,
  descriptor: PropertyDescriptor | undefined
) {
  if (descriptor) {
    Object.defineProperty(target, key, descriptor);
    return;
  }

  Reflect.deleteProperty(target, key);
}

describe('usePreviewCanvas', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 1,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreProperty(window, 'devicePixelRatio', originalDevicePixelRatio);
    restoreProperty(globalThis, 'ResizeObserver', originalResizeObserver);
  });

  it('should size the backing store from the rendered canvas and cap DPR at 2', () => {
    const setTransform = vi.fn();
    const clearRect = vi.fn();
    const draw = vi.fn();

    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 3,
    });

    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(createRect(90.4, 91.6));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect,
      setTransform,
    } as unknown as CanvasRenderingContext2D);

    render(<TestCanvas draw={draw} />);

    const canvas = screen.getByTestId('preview-canvas') as HTMLCanvasElement;

    shouldAssert.exist(canvas);
    shouldAssert.equal(canvas.width, 180);
    shouldAssert.equal(canvas.height, 184);
    expect(setTransform.mock.calls[0]).toEqual([2, 0, 0, 2, 0, 0]);
    expect(clearRect.mock.calls[0]).toEqual([0, 0, 90, 92]);
    shouldAssert.exist(draw.mock.calls[0]?.[0]);
    expect(draw.mock.calls[0]?.[1]).toEqual({ width: 90, height: 92 });
  });

  it('should repaint when the draw callback changes', () => {
    const firstDraw = vi.fn();
    const secondDraw = vi.fn();

    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(
      createRect(PREVIEW_CANVAS_SIZE, PREVIEW_CANVAS_SIZE)
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      setTransform: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    const { rerender } = render(<TestCanvas draw={firstDraw} />);

    shouldAssert.equal(firstDraw.mock.calls.length, 1);
    shouldAssert.equal(secondDraw.mock.calls.length, 0);

    rerender(<TestCanvas draw={secondDraw} />);

    shouldAssert.equal(firstDraw.mock.calls.length, 1);
    shouldAssert.equal(secondDraw.mock.calls.length, 1);
    expect(secondDraw.mock.calls[0]?.[1]).toEqual({
      width: PREVIEW_CANVAS_SIZE,
      height: PREVIEW_CANVAS_SIZE,
    });
  });

  it('should repaint from ResizeObserver measurements when available', () => {
    const draw = vi.fn();
    const disconnect = vi.fn();
    let resizeObserverCallback: ResizeObserverCallback | undefined;
    let observedCanvas: HTMLCanvasElement | undefined;

    class MockResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeObserverCallback = callback;
      }

      observe(target: Element) {
        observedCanvas = target as HTMLCanvasElement;
      }

      disconnect() {
        disconnect();
      }
    }

    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: MockResizeObserver,
    });

    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(
      createRect(PREVIEW_CANVAS_SIZE, PREVIEW_CANVAS_SIZE)
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      setTransform: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    const { unmount } = render(<TestCanvas draw={draw} />);
    const canvas = screen.getByTestId('preview-canvas') as HTMLCanvasElement;

    shouldAssert.exist(canvas);
    shouldAssert.equal(observedCanvas, canvas);

    act(() => {
      resizeObserverCallback?.(
        [{ contentRect: createRect(63.6, 62.2) } as ResizeObserverEntry],
        {} as ResizeObserver
      );
    });

    shouldAssert.equal(draw.mock.calls.length, 2);
    expect(draw.mock.calls[1]?.[1]).toEqual({ width: 64, height: 62 });
    shouldAssert.equal(canvas.width, 64);
    shouldAssert.equal(canvas.height, 62);

    unmount();

    shouldAssert.equal(disconnect.mock.calls.length, 1);
  });

  it('should fall back to window resize events when ResizeObserver is unavailable', () => {
    const draw = vi.fn();
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const removeEventListener = vi.spyOn(window, 'removeEventListener');
    const rect = { width: 50.4, height: 49.6 };

    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: undefined,
    });

    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockImplementation(() =>
      createRect(rect.width, rect.height)
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      setTransform: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    const { unmount } = render(<TestCanvas draw={draw} />);

    shouldAssert.equal(addEventListener.mock.calls.some(([eventName]) => eventName === 'resize'), true);
    expect(draw.mock.calls[0]?.[1]).toEqual({ width: 50, height: 50 });

    rect.width = 80.2;
    rect.height = 79.8;

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    shouldAssert.equal(draw.mock.calls.length, 2);
    expect(draw.mock.calls[1]?.[1]).toEqual({ width: 80, height: 80 });

    unmount();

    shouldAssert.equal(
      removeEventListener.mock.calls.some(([eventName]) => eventName === 'resize'),
      true
    );
  });
});
