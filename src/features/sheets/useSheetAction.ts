import { ref } from 'vue';
import { ApiError, messageFor } from '@/api/errors';
import { useToast } from '@/components/ui/useToast';
export function useSheetAction(invalidate: () => Promise<unknown>) {
  const { toast } = useToast();
  const pending = ref(false);
  async function run(action: () => Promise<unknown>, successTitle: string): Promise<boolean> {
    pending.value = true;
    try {
      await action();
      toast({ title: successTitle, tone: 'success' });
      await invalidate();
      return true;
    } catch (e) {
      toast({ title: messageFor(e), tone: 'error' });
      if (e instanceof ApiError && e.code === 'SHEET_VERSION_CONFLICT') await invalidate();
      return false;
    } finally {
      pending.value = false;
    }
  }
  return { run, pending };
}
