import { expect, it } from 'vitest';
import { buildColorDocs } from '../scripts/generateColorDocs';

it('should match the generated color reference', async () => {
  await expect(buildColorDocs()).toMatchFileSnapshot('./colors.md');
});
