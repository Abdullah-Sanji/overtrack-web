import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useConfirm, useConfirmStore, discardGuard } from './useConfirm';

describe('useConfirm', () => {
  beforeEach(() => setActivePinia(createPinia()));
  it('resolves true on settle(true) and false on settle(false)', async () => {
    const { confirm } = useConfirm();
    const store = useConfirmStore();
    const p1 = confirm({ title: 'A' });
    expect(store.open).toBe(true);
    store.settle(true);
    await expect(p1).resolves.toBe(true);
    const p2 = confirm({ title: 'B' });
    store.settle(false);
    await expect(p2).resolves.toBe(false);
    expect(store.open).toBe(false);
  });
  it('a second ask cancels the first', async () => {
    const { confirm } = useConfirm();
    const first = confirm({ title: 'A' });
    confirm({ title: 'B' });
    await expect(first).resolves.toBe(false);
  });
  it('discardGuard skips the dialog when clean', async () => {
    const store = useConfirmStore();
    await expect(discardGuard(() => false)()).resolves.toBe(true);
    expect(store.open).toBe(false);
  });
});
