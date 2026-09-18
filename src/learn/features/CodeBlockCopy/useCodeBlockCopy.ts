import { useEffect, type RefObject } from 'react';
import styles from '@/learn/features/CodeBlockCopy/CodeBlockCopy.module.css';

const COPIED_DURATION_MS = 2000;

function clipboardSvg(): string {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/></svg>';
}

function checkSvg(): string {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/></svg>';
}

export function useCodeBlockCopy(containerRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const cleanups: (() => void)[] = [];

    const injectButtons = () => {
      for (const pre of container.querySelectorAll('pre[data-copy]')) {
        if (pre.parentElement?.classList.contains(styles.wrapper)) {
          continue;
        }

        const wrapper = document.createElement('div');
        wrapper.className = styles.wrapper;
        wrapper.setAttribute('role', 'group');
        wrapper.setAttribute('aria-label', 'Code block');
        pre.parentNode?.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = styles['copy-button'];
        button.setAttribute('aria-label', 'Copy code to clipboard');
        button.title = 'Copy code to clipboard';
        button.innerHTML = clipboardSvg();

        const announcer = document.createElement('span');
        announcer.className = 'sr-only';
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'polite');
        wrapper.appendChild(announcer);

        let resetTimer: ReturnType<typeof setTimeout> | undefined;
        const handleClick = async () => {
          const code = pre.querySelector('code');
          const text = (code ?? pre).textContent ?? '';

          try {
            await navigator.clipboard.writeText(text);
            button.innerHTML = checkSvg();
            button.setAttribute('aria-label', 'Copied');
            button.dataset.copied = 'true';
            announcer.textContent = 'Copied to clipboard';

            if (resetTimer) {
              clearTimeout(resetTimer);
            }
            resetTimer = setTimeout(() => {
              button.innerHTML = clipboardSvg();
              button.setAttribute('aria-label', 'Copy code to clipboard');
              delete button.dataset.copied;
              announcer.textContent = '';
            }, COPIED_DURATION_MS);
          } catch {
            announcer.textContent = 'Failed to copy';
          }
        };

        button.addEventListener('click', handleClick);
        wrapper.appendChild(button);

        cleanups.push(() => {
          if (resetTimer) {
            clearTimeout(resetTimer);
          }
          button.removeEventListener('click', handleClick);
          wrapper.parentNode?.insertBefore(pre, wrapper);
          wrapper.remove();
        });
      }
    };

    const observer = new MutationObserver(injectButtons);
    observer.observe(container, { childList: true, subtree: true });
    injectButtons();

    return () => {
      observer.disconnect();
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, [containerRef]);
}
