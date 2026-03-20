import type { WorkPhaseState } from './types';

export const DEFAULT_WORK_PHASE_STATE: WorkPhaseState = 'Open';

export function getWorkPhaseState(value?: WorkPhaseState): WorkPhaseState {
  return value ?? DEFAULT_WORK_PHASE_STATE;
}

export function getWorkPhaseClassName(state: WorkPhaseState) {
  if (state === 'In Review') return 'ui-phase-pill ui-phase-pill-review';
  if (state === 'Closed') return 'ui-phase-pill ui-phase-pill-closed';
  return 'ui-phase-pill ui-phase-pill-open';
}
