import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface TokenValue {
  dark: string;
  light: string;
  darkHc: string;
  lightHc: string;
}

const THEME_CSS_PATH = resolve(process.cwd(), 'src/app/theme.css');

function parseDeclarations(css: string, selector: string): Record<string, string> {
  const block = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\}`).exec(css);
  const result: Record<string, string> = {};

  if (!block) {
    return result;
  }

  const declarations = block[1].replace(/\/\*[\s\S]*?\*\//g, '');

  for (const entry of declarations.split(';')) {
    const match = /\s*(--[\w-]+)\s*:\s*([^;]+)/.exec(entry);
    if (match) {
      result[match[1]] = match[2].trim();
    }
  }

  return result;
}

export function readThemeTokens(): Record<string, TokenValue> {
  const css = readFileSync(THEME_CSS_PATH, 'utf8');
  const root = parseDeclarations(css, ':root');
  const light = parseDeclarations(css, '\\.light(?!\\.)');
  const highContrast = parseDeclarations(css, '(?<!\\.light)\\.high-contrast');
  const lightHighContrast = parseDeclarations(css, '\\.light\\.high-contrast');
  const tokens: Record<string, TokenValue> = {};

  // `.high-contrast` is declared after `.light`, so for an element carrying
  // both classes a token overridden only in `.high-contrast` would beat the
  // `.light` value and leak a dark high-contrast color into the light theme.
  // Require an explicit `.light.high-contrast` override for every such token.
  const leaked = Object.keys(highContrast).filter((name) => !(name in lightHighContrast));
  if (leaked.length > 0) {
    throw new Error(
      `.light.high-contrast must override every token .high-contrast sets; missing: ${leaked.join(', ')}`
    );
  }

  for (const [name, dark] of Object.entries(root)) {
    // Fallback chains mirror the CSS cascade for an element carrying both
    // classes: `.high-contrast` is declared after `.light`, so it wins ties,
    // and `.light.high-contrast` (higher specificity) wins over both.
    tokens[name] = {
      dark,
      light: light[name] ?? dark,
      darkHc: highContrast[name] ?? dark,
      lightHc: lightHighContrast[name] ?? highContrast[name] ?? light[name] ?? dark,
    };
  }

  return tokens;
}
