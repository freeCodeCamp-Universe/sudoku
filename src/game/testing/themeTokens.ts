import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface TokenValue {
  dark: string;
  light: string;
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
  const light = parseDeclarations(css, '\\.light');
  const tokens: Record<string, TokenValue> = {};

  for (const [name, dark] of Object.entries(root)) {
    tokens[name] = { dark, light: light[name] ?? dark };
  }

  return tokens;
}
