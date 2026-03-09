/**
 * MobileBridge — detects iframe / WebView context and handles
 * cross-app SSO token handoff from Dope-Budz.
 *
 * Two ingestion paths:
 *   1. URL query param  ?sso=<JWT>
 *   2. postMessage from parent window  { type: 'SSO_TOKEN', token: '<JWT>' }
 */

export interface SSOPayload {
  success: boolean;
  user?: {
    id: number;
    walletAddress: string;
    displayName: string;
    gbuxBalance: number;
    budzBalance: number;
    loginMethod: string;
    isAuthenticated: boolean;
    source: string;
  };
  error?: string;
}

/** Is the page running inside an iframe? */
export function isEmbedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true; // cross-origin frame → embedded
  }
}

/** Is the page running inside a mobile WebView? */
export function isWebView(): boolean {
  const ua = navigator.userAgent || '';
  return /wv|WebView/i.test(ua) || (/Android/.test(ua) && /Version\/\d/.test(ua));
}

/** Extract ?sso= JWT from the current URL and remove it from the address bar. */
export function extractSSOToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('sso');
  if (token) {
    // Clean URL so the token isn't bookmarked / leaked in referer
    params.delete('sso');
    const clean = params.toString();
    const newUrl = window.location.pathname + (clean ? `?${clean}` : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
  }
  return token || null;
}

/** Verify an SSO JWT against the server and return user data. */
export async function verifySSOToken(token: string): Promise<SSOPayload> {
  try {
    const res = await fetch('/api/auth/sso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Network error during SSO verification' };
  }
}

/**
 * Listen for SSO tokens arriving via postMessage from a parent window.
 * Returns a cleanup function.
 */
export function listenForSSOMessages(
  onToken: (token: string) => void,
): () => void {
  const handler = (event: MessageEvent) => {
    // Accept messages from any origin in dev; tighten in prod
    if (event.data?.type === 'SSO_TOKEN' && typeof event.data.token === 'string') {
      onToken(event.data.token);
    }
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

/** Notify parent window that the app is ready to receive tokens. */
export function notifyParentReady(): void {
  if (isEmbedded()) {
    try {
      window.parent.postMessage({ type: 'BATTLE_READY' }, '*');
    } catch {}
  }
}
