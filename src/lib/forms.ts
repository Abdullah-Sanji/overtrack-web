import { nextTick } from 'vue';

/** Move focus to the first field flagged invalid after a failed submit. */
export async function focusFirstInvalid(): Promise<void> {
  await nextTick();
  document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}
