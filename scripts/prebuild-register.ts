/**
 * Node.js `--import` entry point that registers the prebuild hooks.
 *
 * The `--import` flag requires the file to call `module.register()` pointing
 * to the actual hooks module (which exports resolve/load functions). Simply
 * exporting hooks from this file is the old `--loader` API and is ignored
 * when used with `--import`.
 *
 * Usage: node --import tsx/esm --import ./scripts/prebuild-register.ts script.ts
 */

import { register } from 'node:module';

register(new URL('./prebuild-hooks.ts', import.meta.url).href, import.meta.url);
