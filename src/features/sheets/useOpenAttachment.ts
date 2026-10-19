import { sheetsApi } from '@/api/sheets.api';
import { messageFor } from '@/api/errors';
import { useToast } from '@/components/ui/useToast';

/** Returns a handler that opens an attachment and toasts on failure (403/404/network). */
export function useOpenAttachment() {
  const { toast } = useToast();
  return async (id: string) => {
    try {
      await sheetsApi.openAttachment(id);
    } catch (e) {
      toast({ title: messageFor(e), tone: 'error' });
    }
  };
}
