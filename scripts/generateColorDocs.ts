import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildColorDocs } from '../src/app/colorDocs';

writeFileSync(resolve(process.cwd(), 'docs/colors.md'), buildColorDocs());
