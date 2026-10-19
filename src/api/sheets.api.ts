import { get, post, patch, del, request, API_URL } from './client';
import { downloadResponse } from '@/lib/download';
import type { Paged, SheetSummary, SheetDetail, EntryView } from './types';

export interface EntryInput {
  date: string;
  startTime: string;
  endTime: string;
  hours?: number;
  overtimeTypeId: string;
  workItem: string;
  workItemUrl?: string | null;
  description: string;
  requestedById?: string | null;
}

export const sheetsApi = {
  list: (
    q: {
      employeeId?: string;
      teamId?: string;
      period?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) => get<Paged<SheetSummary>>('/sheets', q),
  forPeriod: (period: string) =>
    post<{ data: SheetSummary }>('/sheets/for-period', { period }).then((r) => r.data),
  get: (id: string) => get<{ data: SheetDetail }>(`/sheets/${id}`).then((r) => r.data),
  addEntry: (sheetId: string, body: EntryInput) =>
    post<{ data: EntryView }>(`/sheets/${sheetId}/entries`, body).then((r) => r.data),
  updateEntry: (sheetId: string, entryId: string, body: Partial<EntryInput>) =>
    patch<{ data: EntryView }>(`/sheets/${sheetId}/entries/${entryId}`, body).then((r) => r.data),
  deleteEntry: (sheetId: string, entryId: string) => del<void>(`/sheets/${sheetId}/entries/${entryId}`),
  uploadAttachment: (sheetId: string, entryId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<{ data: NonNullable<EntryView['attachment']> }>(
      'POST',
      `/sheets/${sheetId}/entries/${entryId}/attachment`,
      { formData: fd },
    ).then((r) => r.data);
  },
  deleteAttachment: (sheetId: string, entryId: string) =>
    del<void>(`/sheets/${sheetId}/entries/${entryId}/attachment`),
  openAttachment: async (id: string) => {
    // Open synchronously (inside the user gesture) so the popup is not blocked.
    const w = window.open('', '_blank');
    let res: Response;
    try {
      res = await request<Response>('GET', `/attachments/${id}`, { raw: true });
    } catch (e) {
      w?.close();
      throw e;
    }
    if (!w) {
      await downloadResponse(res, 'attachment');
      return;
    }
    const url = URL.createObjectURL(await res.blob());
    w.opener = null;
    w.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
  attachmentUrl: (id: string) => `${API_URL}/attachments/${id}`,
};
