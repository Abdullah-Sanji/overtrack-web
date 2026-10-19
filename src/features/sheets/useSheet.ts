import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { sheetsApi } from '@/api/sheets.api';

export function useSheet(id: string) {
  const qc = useQueryClient();
  const sheet = useQuery({ queryKey: ['sheet', id], queryFn: () => sheetsApi.get(id) });
  const invalidate = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['sheet', id] }),
      qc.invalidateQueries({ queryKey: ['sheets'] }),
      qc.invalidateQueries({ queryKey: ['timeline', id] }),
    ]);
  return { sheet, invalidate };
}
