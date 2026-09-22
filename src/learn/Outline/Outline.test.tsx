import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import type { Heading } from '@/learn/utils/extractHeadings';
import { Outline } from '@/learn/Outline/Outline';

const headings: Heading[] = [
  { level: 2, text: 'Overview', id: 'overview' },
  { level: 3, text: 'Details', id: 'details' },
  { level: 2, text: 'Summary', id: 'summary' },
];

function renderOutline(overrides: Partial<Parameters<typeof Outline>[0]> = {}) {
  const props = {
    id: 'lesson-outline',
    headings,
    mode: 'sidebar' as const,
    open: true,
    onClose: vi.fn(),
    ...overrides,
  };
  return { ...render(<Outline {...props} />), props };
}

describe('Outline', () => {
  it('should render nothing when there are no headings', () => {
    renderOutline({ headings: [] });
    expect(screen.queryByRole('navigation', { name: 'Outline' })).toBeNull();
  });

  it('should render heading links with correct href values', () => {
    renderOutline();

    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '#overview');
    expect(screen.getByRole('link', { name: 'Details' })).toHaveAttribute('href', '#details');
    expect(screen.getByRole('link', { name: 'Summary' })).toHaveAttribute('href', '#summary');
  });

  it('should mark the active heading with aria-current="location"', () => {
    let callback: IntersectionObserverCallback | undefined;

    class TestIntersectionObserver {
      constructor(observerCallback: IntersectionObserverCallback) {
        callback = observerCallback;
      }

      observe() {}
      disconnect() {}
    }

    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);
    renderOutline();

    const overviewHeading = document.createElement('h2');
    overviewHeading.id = 'overview';
    const createEntry = (
      target: Element,
      isIntersecting: boolean,
      top: number
    ): IntersectionObserverEntry => ({
      boundingClientRect: { top } as DOMRectReadOnly,
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: { top } as DOMRectReadOnly,
      isIntersecting,
      rootBounds: null,
      target,
      time: 0,
    });

    act(() => {
      callback?.([createEntry(overviewHeading, true, 100)], {} as IntersectionObserver);
    });

    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'location'
    );
  });

  it('should keep a nested heading active when its parent leaves the detection zone', () => {
    let callback: IntersectionObserverCallback | undefined;

    class TestIntersectionObserver {
      constructor(observerCallback: IntersectionObserverCallback) {
        callback = observerCallback;
      }

      observe() {}
      disconnect() {}
    }

    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver);
    renderOutline();

    const overview = screen.getByRole('link', { name: 'Overview' });
    const details = screen.getByRole('link', { name: 'Details' });
    const overviewHeading = document.createElement('h2');
    overviewHeading.id = 'overview';
    const detailsHeading = document.createElement('h3');
    detailsHeading.id = 'details';
    const createEntry = (
      target: Element,
      isIntersecting: boolean,
      top: number
    ): IntersectionObserverEntry => ({
      boundingClientRect: { top } as DOMRectReadOnly,
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: { top } as DOMRectReadOnly,
      isIntersecting,
      rootBounds: null,
      target,
      time: 0,
    });

    act(() => {
      callback?.(
        [createEntry(overviewHeading, true, 100), createEntry(detailsHeading, true, 120)],
        {} as IntersectionObserver
      );
    });
    expect(overview).toHaveAttribute('aria-current', 'location');

    act(() => {
      callback?.([createEntry(overviewHeading, false, 50)], {} as IntersectionObserver);
    });

    expect(details).toHaveAttribute('aria-current', 'location');
    expect(overview).not.toHaveAttribute('aria-current', 'location');
  });
});
