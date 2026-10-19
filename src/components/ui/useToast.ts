import { ref } from 'vue';
export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: 'success' | 'error' | 'info';
}
const toasts = ref<Toast[]>([]);
let seq = 0;
export function useToast() {
  function toast(o: { title: string; description?: string; tone?: Toast['tone'] }) {
    const id = ++seq;
    toasts.value.push({ id, title: o.title, description: o.description, tone: o.tone ?? 'info' });
    setTimeout(() => dismiss(id), 4000);
    return id;
  }
  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }
  return { toast, dismiss, toasts };
}
