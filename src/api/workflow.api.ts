import { get, post } from './client';
import type { SheetSummary, Timeline } from './types';
const act = (id: string, action: string, body: Record<string, unknown>) =>
  post<{ data: SheetSummary }>(`/sheets/${id}/${action}`, body).then((r) => r.data);
export const workflowApi = {
  submit: (id: string, version: number) => act(id, 'submit', { version }),
  withdraw: (id: string, version: number) => act(id, 'withdraw', { version }),
  approve: (id: string, version: number, comment?: string, overrideReason?: string) =>
    act(id, 'approve', { version, comment, overrideReason }),
  reject: (id: string, version: number, reason: string, overrideReason?: string) =>
    act(id, 'reject', { version, reason, overrideReason }),
  reopen: (id: string, version: number, reason: string) => act(id, 'reopen', { version, reason }),
  markPaid: (id: string, version: number, paymentReference: string, paidAt?: string) =>
    act(id, 'mark-paid', { version, paymentReference, paidAt }),
  revertPaid: (id: string, version: number, reason: string) => act(id, 'revert-paid', { version, reason }),
  markPaidBulk: (sheets: Array<{ id: string; version: number }>, paymentReference: string, paidAt?: string) =>
    post<{ data: { paid: string[]; failed: Array<{ id: string; code: string }> } }>('/sheets/mark-paid', {
      sheets,
      paymentReference,
      paidAt,
    }).then((r) => r.data),
  timeline: (id: string) => get<{ data: Timeline }>(`/sheets/${id}/timeline`).then((r) => r.data),
};
