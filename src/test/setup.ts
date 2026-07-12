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

// jsdom has no `matchMedia`. Derive `matches` from `window.innerWidth` so tests
// can drive responsive breakpoints by setting `window.innerWidth` before render.
// Only `(min-width: Npx)` / `(max-width: Npx)` queries are supported; anything
// else reports no match so an unsupported query fails loudly in tests. The shim
// never fires `change` events, so width changes after render are not observed.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => {
    const min = /\(min-width:\s*(\d+(?:\.\d+)?)px\)/.exec(query);
    const max = /\(max-width:\s*(\d+(?:\.\d+)?)px\)/.exec(query);
    const width = window.innerWidth;
    const matches =
      (min !== null || max !== null) &&
      (min ? width >= Number(min[1]) : true) &&
      (max ? width <= Number(max[1]) : true);
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList;
  };
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
