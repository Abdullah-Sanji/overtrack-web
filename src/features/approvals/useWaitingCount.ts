import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { inboxApi } from '@/api/inbox.api';

/** Number of sheets waiting for the current user's decision (drives the sidebar badge). */
export function useWaitingCount() {
  const q = useQuery({
    queryKey: ['inbox', 'waiting', 'count'],
    queryFn: () => inboxApi.list('waiting', 1, 1),
    refetchInterval: 60_000,
  });
  return computed(() => q.data.value?.meta.total);
}
