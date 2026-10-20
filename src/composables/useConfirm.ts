import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'destructive';
}

export const useConfirmStore = defineStore('confirm', () => {
  const open = ref(false);
  const options = ref<ConfirmOptions>({ title: '' });
  let resolver: ((v: boolean) => void) | null = null;
  function ask(o: ConfirmOptions): Promise<boolean> {
    resolver?.(false);
    options.value = o;
    open.value = true;
    return new Promise((resolve) => {
      resolver = resolve;
    });
  }
  function settle(v: boolean) {
    open.value = false;
    const r = resolver;
    resolver = null;
    r?.(v);
  }
  return { open, options, ask, settle };
});

export function useConfirm() {
  const store = useConfirmStore();
  return { confirm: (o: ConfirmOptions) => store.ask(o) };
}

/** Guard for drawers and route leaves: resolves true when there is nothing to lose or the user chose Discard. */
export function discardGuard(isDirty: () => boolean): () => Promise<boolean> {
  const { confirm } = useConfirm();
  return async () =>
    !isDirty() ||
    confirm({
      title: 'Discard unsaved changes?',
      description: 'Your changes will be lost.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      tone: 'destructive',
    });
}
