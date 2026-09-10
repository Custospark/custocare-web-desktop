import { useCallback, useRef, useState } from 'react';

const POPUP_WIDTH = 600;
const POPUP_HEIGHT = 760;
const POPUP_NAME = 'custocare_payment_window';

export type PaymentEnvironment = 'electron' | 'mobile' | 'desktop';

function detectEnvironment(): PaymentEnvironment {
  if (typeof window === 'undefined') return 'desktop';
  if (navigator.userAgent.toLowerCase().includes('electron')) return 'electron';
  if (window.matchMedia('(max-width: 768px)').matches) return 'mobile';
  return 'desktop';
}

/**
 * Paint a lightweight loading page into the blank popup so it never shows an
 * empty window while the initiate request is still in flight.
 */
function paintLoading(win: Window): void {
  try {
    win.document.open();
    win.document.write(
      '<!doctype html><html><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>Custocare Payment</title>' +
      '<style>html,body{height:100%;margin:0;display:flex;align-items:center;justify-content:center;' +
      'background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#334155;}' +
      '.box{text-align:center;padding:24px;}.spin{width:clamp(44px,10vw,64px);height:clamp(44px,10vw,64px);' +
      'border:5px solid #bfdbfe;border-top-color:#2563eb;border-radius:50%;animation:s 0.8s linear infinite;' +
      'margin:0 auto clamp(16px,3vw,20px);}' +
      '@keyframes s{to{transform:rotate(360deg)}}p{font-size:clamp(16px,4.5vw,22px);font-weight:600;margin:0;' +
      'line-height:1.4;color:#1e293b}</style></head>' +
      '<body><div class="box"><div class="spin"></div><p>Connecting to secure payment...</p></div></body></html>',
    );
    win.document.close();
  } catch {
    // Some environments restrict writes; the redirect replaces the page anyway.
  }
}

export interface PaymentPopup {
  environment: PaymentEnvironment;
  /** True when the popup/tab could not be opened and a manual fallback is needed. */
  popupBlocked: boolean;
  paymentUrl: string | null;
  openPaymentPopup: () => boolean;
  redirectPaymentWindow: (url: string) => boolean;
  /** Close the gateway window but keep the waiting-for-payment flow alive. */
  dismissGateway: () => void;
  closePaymentPopup: () => void;
  resetPaymentPopup: () => void;
}

/**
 * Device-aware payment window handling (Custosell standard).
 *
 * Open blank SYNCHRONOUSLY inside the click gesture (browsers allow it),
 * then redirect that same window once the API returns the gateway URL.
 * Never navigate from inside an async callback - browsers block it and the
 * user is left polling with no payment page.
 */
export function usePaymentPopup(): PaymentPopup {
  const popupRef = useRef<Window | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [environment] = useState<PaymentEnvironment>(detectEnvironment);

  const closePaymentPopupRef = useCallback(() => {
    const win = popupRef.current;
    if (win && !win.closed) {
      try {
        win.close();
      } catch {
        // Cross-origin windows can throw on close; safe to ignore.
      }
    }
    popupRef.current = null;
  }, []);

  // NOTE (Custosell standard): no auto-close on unmount. The payment window
  // belongs to the USER once opened - only explicit user actions
  // (Done/Close buttons, cancel-and-retry, bypass cleanup) may close it.
  // An orphaned window is a minor nuisance; a murdered checkout is lost
  // revenue.

  const openPaymentPopup = useCallback((): boolean => {
    setPopupBlocked(false);
    setPaymentUrl(null);

    if (environment === 'mobile') {
      const win = window.open('', '_blank');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        setPopupBlocked(true);
        return false;
      }
      popupRef.current = win;
      paintLoading(win);
      return true;
    }

    const left = Math.max(0, Math.round((window.screen.width - POPUP_WIDTH) / 2));
    const top = Math.max(0, Math.round((window.screen.height - POPUP_HEIGHT) / 3));
    const win = window.open(
      '',
      POPUP_NAME,
      `popup=yes,width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top}`,
    );
    if (!win || win.closed || typeof win.closed === 'undefined') {
      setPopupBlocked(true);
      return false;
    }
    popupRef.current = win;
    paintLoading(win);
    return true;
  }, [environment]);

  const redirectPaymentWindow = useCallback((url: string): boolean => {
    setPaymentUrl(url);
    const win = popupRef.current;
    if (!win || win.closed) {
      setPopupBlocked(true);
      return false;
    }
    try {
      win.location.href = url;
      return true;
    } catch {
      setPopupBlocked(true);
      return false;
    }
  }, []);

  const closePaymentPopup = useCallback(() => {
    closePaymentPopupRef();
  }, [closePaymentPopupRef]);

  const resetPaymentPopup = useCallback(() => {
    closePaymentPopupRef();
    setPopupBlocked(false);
    setPaymentUrl(null);
  }, [closePaymentPopupRef]);

  const dismissGateway = useCallback(() => {
    closePaymentPopupRef();
    setPaymentUrl(null);
  }, [closePaymentPopupRef]);

  return {
    environment,
    popupBlocked,
    paymentUrl,
    openPaymentPopup,
    redirectPaymentWindow,
    dismissGateway,
    closePaymentPopup,
    resetPaymentPopup,
  };
}
