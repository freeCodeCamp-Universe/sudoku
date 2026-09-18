import type { ChecklistRequirement } from '@/learn/curriculum/types';

export type ChecklistStatus = 'not-done' | 'completed' | 'error';

export interface ChecklistItem {
  label: string;
  hint?: string;
  count?: number;
  showHint: boolean;
  status: ChecklistStatus;
}

/** Build the initial checklist state from authored requirements. */
export function initChecklist(requirements: ChecklistRequirement[]): ChecklistItem[] {
  return requirements.map((req) => ({
    label: req.label,
    hint: req.hint,
    showHint: false,
    status: 'not-done',
  }));
}
