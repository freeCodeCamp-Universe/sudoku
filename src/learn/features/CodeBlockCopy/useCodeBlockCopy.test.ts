import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCodeBlockCopy } from '@/learn/features/CodeBlockCopy/useCodeBlockCopy';

describe('useCodeBlockCopy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should inject a copy button only into marked code blocks', () => {
    const container = document.createElement('div');
    container.innerHTML =
      '<pre data-copy><code>const value = 1;</code></pre><pre><code>plain</code></pre>';
    document.body.appendChild(container);

    const { unmount } = renderHook(() => useCodeBlockCopy({ current: container }));

    // The hook mutates a caller-owned DOM container, so structural queries are required here.
    /* eslint-disable testing-library/no-node-access */
    expect(container.querySelectorAll('button')).toHaveLength(1);
    expect(container.querySelector('[role="group"]')).toBeInTheDocument();
    expect(
      container.querySelector('pre')?.parentElement?.querySelector('button')
    ).toBeInTheDocument();
    /* eslint-enable testing-library/no-node-access */
    unmount();
    container.remove();
  });

  it('should copy the code and announce the copied state', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const container = document.createElement('div');
    container.innerHTML = '<pre data-copy><code>const value = 1;</code></pre>';
    document.body.appendChild(container);

    const { unmount } = renderHook(() => useCodeBlockCopy({ current: container }));
    /* eslint-disable testing-library/no-node-access */
    const button = container.querySelector('button');
    /* eslint-enable testing-library/no-node-access */

    await act(async () => {
      button?.click();
    });

    expect(writeText).toHaveBeenCalledWith('const value = 1;');
    expect(button).toHaveAttribute('aria-label', 'Copied');
    expect(button).toHaveAttribute('data-copied', 'true');
    /* eslint-disable testing-library/no-node-access */
    expect(container.querySelector('[role="status"]')).toHaveTextContent('Copied to clipboard');
    /* eslint-enable testing-library/no-node-access */
    unmount();
    container.remove();
  });

  it('should unwrap marked code blocks on unmount', () => {
    const container = document.createElement('div');
    container.innerHTML = '<pre data-copy><code>content</code></pre>';
    document.body.appendChild(container);

    const { unmount } = renderHook(() => useCodeBlockCopy({ current: container }));
    unmount();

    /* eslint-disable testing-library/no-node-access */
    expect(container.querySelector('pre')).toBeInTheDocument();
    expect(container.querySelector('[role="group"]')).not.toBeInTheDocument();
    expect(container.querySelector('button')).not.toBeInTheDocument();
    /* eslint-enable testing-library/no-node-access */
    container.remove();
  });

  it('should restore buttons when the rendered markdown DOM is replaced', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<pre data-copy><code>before</code></pre>';
    document.body.appendChild(container);

    const { unmount } = renderHook(() => useCodeBlockCopy({ current: container }));
    container.innerHTML = '<pre data-copy><code>after</code></pre>';

    await waitFor(() => {
      /* eslint-disable testing-library/no-node-access */
      expect(container.querySelectorAll('button')).toHaveLength(1);
      /* eslint-enable testing-library/no-node-access */
    });

    unmount();
    container.remove();
  });
});
