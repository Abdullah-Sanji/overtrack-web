import { describe, it, expect, vi } from 'vitest';
import { useToast } from './useToast';
describe('useToast', () => {
  it('adds and auto-removes after 4s', () => {
    vi.useFakeTimers();
    const { toast, toasts } = useToast();
    toast({ title: 'Saved', tone: 'success' });
    expect(toasts.value).toHaveLength(1);
    vi.advanceTimersByTime(4000);
    expect(toasts.value).toHaveLength(0);
    vi.useRealTimers();
  });
  it('keeps the action and uses the longer timeout', () => {
    vi.useFakeTimers();
    const { toast, toasts } = useToast();
    toast({ title: 'Failed', tone: 'error', action: { label: 'Undo', onClick: vi.fn() } });
    expect(toasts.value[0].action?.label).toBe('Undo');
    vi.advanceTimersByTime(4000);
    expect(toasts.value).toHaveLength(1);
    vi.advanceTimersByTime(4000);
    expect(toasts.value).toHaveLength(0);
    vi.useRealTimers();
  });
});
