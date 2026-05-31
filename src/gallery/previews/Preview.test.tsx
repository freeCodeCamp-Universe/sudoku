import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/app/ThemeProvider';
import { variantRegistry } from '@/variants/registry';
import { Preview } from './Preview';

describe('Preview', () => {
  it('should render every registered preview without throwing', () => {
    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    for (const variantId of Object.keys(variantRegistry)) {
      expect(() => {
        const { unmount } = render(
          <ThemeProvider>
            <Preview variantId={variantId} />
          </ThemeProvider>
        );

        unmount();
      }).not.toThrow();
    }

    getContextSpy.mockRestore();
  });
});
