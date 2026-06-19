import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildColorDocs } from '../src/game/testing/colorDocs';

writeFileSync(resolve(process.cwd(), 'docs/colors.md'), buildColorDocs());
