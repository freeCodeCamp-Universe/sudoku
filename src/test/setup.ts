import '@testing-library/jest-dom';

// Node.js v22+ exposes a native `localStorage` global but it is `undefined` without
// `--localstorage-file`. Polyfill it so tests that use ThemeProvider or localStorage
// directly work correctly in the jsdom environment.
if (typeof localStorage === 'undefined' || localStorage === null) {
  const store: Record<string, string> = {};
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: {
      getItem: (key: string): string | null => (key in store ? store[key] : null),
      setItem: (key: string, value: string): void => {
        store[key] = String(value);
      },
      removeItem: (key: string): void => {
        delete store[key];
      },
      clear: (): void => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      get length(): number {
        return Object.keys(store).length;
      },
      key: (n: number): string | null => Object.keys(store)[n] ?? null,
    },
  });
}

if (typeof HTMLDialogElement !== 'undefined') {
  if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '');
    };
  }

  if (typeof HTMLDialogElement.prototype.close !== 'function') {
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
}
