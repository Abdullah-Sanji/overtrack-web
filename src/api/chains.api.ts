import { get, put } from './client';
import type { ChainStepView } from './types';
export const chainsApi = {
  get: (teamId: string) => get<{ data: ChainStepView[] }>(`/teams/${teamId}/chain`).then((r) => r.data),
  replace: (
    teamId: string,
    steps: Array<{ label: string; approverId: string; backupApproverId?: string | null }>,
  ) => put<{ data: ChainStepView[] }>(`/teams/${teamId}/chain`, { steps }).then((r) => r.data),
};
