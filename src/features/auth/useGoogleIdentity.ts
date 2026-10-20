import { onBeforeUnmount, onMounted, type Ref } from 'vue';
import { useUiStore } from '@/stores/ui.store';

interface GoogleAccountsId {
  initialize(cfg: { client_id: string; callback: (r: { credential: string }) => void }): void;
  renderButton(el: HTMLElement, opts: Record<string, string | number>): void;
}
declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let loading: Promise<void> | null = null;

/** Injects the Google Identity Services script once per page; resolves when `window.google.accounts.id` exists. */
function loadScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => (window.google?.accounts?.id ? resolve() : reject(new Error('gsi missing')));
    s.onerror = () => {
      loading = null;
      reject(new Error('gsi failed'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/**
 * Renders Google's own sign-in button into `opts.buttonEl` on mount. `onCredential` receives the ID token;
 * `onUnavailable` fires once if the script does not load within `timeoutMs` (blocked, offline, …).
 */
export function useGoogleIdentity(opts: {
  buttonEl: Ref<HTMLElement | null>;
  clientId: string;
  onCredential: (credential: string) => void;
  onUnavailable: () => void;
  timeoutMs?: number;
}) {
  const { buttonEl } = opts;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let settled = false;
  const fail = () => {
    if (settled) return;
    settled = true;
    opts.onUnavailable();
  };

  onMounted(() => {
    const theme = useUiStore().theme === 'dark' ? 'filled_black' : 'outline';
    timer = setTimeout(fail, opts.timeoutMs ?? 5000);
    loadScript()
      .then(() => {
        if (settled || !buttonEl.value) return;
        settled = true;
        clearTimeout(timer);
        const id = window.google!.accounts!.id!;
        id.initialize({ client_id: opts.clientId, callback: (r) => opts.onCredential(r.credential) });
        id.renderButton(buttonEl.value, {
          type: 'standard',
          size: 'large',
          shape: 'rectangular',
          text: 'signin_with',
          theme,
          width: Math.max(200, buttonEl.value.clientWidth),
        });
      })
      .catch(fail);
  });
  onBeforeUnmount(() => clearTimeout(timer));
}
