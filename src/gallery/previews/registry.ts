import type { ComponentType } from 'react';
import { ArgylePreview } from './ArgylePreview';
import { ArrowPreview } from './ArrowPreview';
import { AsteriskPreview } from './AsteriskPreview';
import { CenterDotPreview } from './CenterDotPreview';
import { GirandolaPreview } from './GirandolaPreview';
import { ButterflyPreview } from './ButterflyPreview';
import { CrossPreview } from './CrossPreview';
import { FlowerPreview } from './FlowerPreview';
import { KazagurumaPreview } from './KazagurumaPreview';
import { TwodokuPreview } from './TwodokuPreview';
import { SoheiPreview } from './SoheiPreview';
import { ChainPreview } from './ChainPreview';
import { ClassicPreview } from './ClassicPreview';
import { ColorPreview } from './ColorPreview';
import { ConsecutivePreview } from './ConsecutivePreview';
import { EvenOddPreview } from './EvenOddPreview';
import { GreaterThanPreview } from './GreaterThanPreview';
import { JigsawPreview } from './JigsawPreview';
import { KillerPreview } from './KillerPreview';
import { MiniSudokuPreview } from './MiniSudokuPreview';
import { SamuraiPreview } from './SamuraiPreview';
import { SandwichPreview } from './SandwichPreview';
import { SkyscraperPreview } from './SkyscraperPreview';
import { SujikenPreview } from './SujikenPreview';
import { SudokuXPreview } from './SudokuXPreview';
import { SuperPreview } from './SuperPreview';
import { WindokuPreview } from './WindokuPreview';
import { WordokuPreview } from './WordokuPreview';

type PreviewComponent = ComponentType<{ variantId: string }>;

export const previewRegistry: Record<string, PreviewComponent> = {
  classic: ClassicPreview,
  killer: KillerPreview,
  samurai: SamuraiPreview,
  'sudoku-x': SudokuXPreview,
  jigsaw: JigsawPreview,
  windoku: WindokuPreview,
  arrow: ArrowPreview,
  'even-odd': EvenOddPreview,
  consecutive: ConsecutivePreview,
  'greater-than': GreaterThanPreview,
  skyscraper: SkyscraperPreview,
  mini: MiniSudokuPreview,
  super: SuperPreview,
  wordoku: WordokuPreview,
  color: ColorPreview,
  asterisk: AsteriskPreview,
  'center-dot': CenterDotPreview,
  girandola: GirandolaPreview,
  argyle: ArgylePreview,
  butterfly: ButterflyPreview,
  cross: CrossPreview,
  flower: FlowerPreview,
  kazaguruma: KazagurumaPreview,
  twodoku: TwodokuPreview,
  sohei: SoheiPreview,
  chain: ChainPreview,
  sandwich: SandwichPreview,
  sujiken: SujikenPreview,
};
