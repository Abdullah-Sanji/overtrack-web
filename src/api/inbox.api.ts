import { get } from './client';
import type { Paged, InboxRow } from './types';

export type InboxScope = 'waiting' | 'upcoming' | 'decided';

export const inboxApi = {
  list: (scope: InboxScope, page = 1, pageSize = 20) =>
    get<Paged<InboxRow>>('/approvals/inbox', { scope, page, pageSize }),
};
