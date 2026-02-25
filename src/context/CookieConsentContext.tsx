'use client';

import { createContext, useContext, useState, useSyncExternalStore } from 'react';

const COOKIE_CONSENT_STORAGE_KEY = 'pass-the-track.cookie-consent.v1';
const COOKIE_CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const cookieConsentListeners = new Set<() => void>();

type CookieConsentValue = 'accepted' | 'rejected' | null;
type PersistedCookieConsent = {
  value: Exclude<CookieConsentValue, null>;
  updatedAt: number;
};

interface CookieConsentContextValue {
  consent: CookieConsentValue;
  openBanner: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function readStoredConsent(): CookieConsentValue {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  if (rawValue === 'accepted' || rawValue === 'rejected') {
    return rawValue;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== 'object') {
      window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
      return null;
    }

    const value = (parsedValue as Partial<PersistedCookieConsent>).value;
    const updatedAt = (parsedValue as Partial<PersistedCookieConsent>).updatedAt;
    const isValidValue = value === 'accepted' || value === 'rejected';
    const isValidTimestamp = typeof updatedAt === 'number' && Number.isFinite(updatedAt);
    if (!isValidValue || !isValidTimestamp) {
      window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
      return null;
    }

    const isExpired = Date.now() - updatedAt > COOKIE_CONSENT_MAX_AGE_MS;
    if (isExpired) {
      window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
      return null;
    }

    return value;
  } catch {
    window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
    return null;
  }
}

function persistConsent(value: Exclude<CookieConsentValue, null>) {
  const payload: PersistedCookieConsent = {
    value,
    updatedAt: Date.now(),
  };
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload));
  cookieConsentListeners.forEach((listener) => listener());
}

function subscribeToCookieConsent(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === COOKIE_CONSENT_STORAGE_KEY) {
      listener();
    }
  };

  cookieConsentListeners.add(listener);
  window.addEventListener('storage', handleStorage);
  return () => {
    cookieConsentListeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

function CookieBanner({
  canClose,
  onAccept,
  onReject,
  onClose,
}: {
  canClose: boolean;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/20 bg-black/85 backdrop-blur-xl p-4 sm:p-5 shadow-[0_16px_44px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#00d4ff] font-black">Cookie Consent</p>
            <h2 className="mt-1 text-base font-black text-white">Analytics cookies are optional</h2>
          </div>
          {canClose && (
            <button
              type="button"
              aria-label="Close cookie banner"
              onClick={onClose}
              className="w-7 h-7 rounded-full border border-white/25 bg-black/30 text-zinc-300 hover:text-white hover:border-[#00d4ff]/70 transition-all"
            >
              ×
            </button>
          )}
        </div>

        <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
          We are based in the UK and ask for consent before enabling non-essential analytics. Accepting enables
          Vercel Analytics to measure aggregate usage. Rejecting keeps analytics off. We only store your choice locally
          so we remember it, and we ask again every 6 months.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onReject}
            className="sm:flex-1 rounded-xl border border-white/25 bg-white/[0.04] py-2.5 px-4 text-xs font-black uppercase tracking-[0.12em] text-zinc-200 hover:border-white/45 hover:bg-white/[0.08] transition"
          >
            Reject Non-Essential
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="sm:flex-1 rounded-xl border border-[#00d4ff]/70 bg-[#00d4ff] py-2.5 px-4 text-xs font-black uppercase tracking-[0.12em] text-black shadow-[0_0_16px_rgba(0,212,255,0.32)]"
          >
            Accept Analytics
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const consent = useSyncExternalStore(
    subscribeToCookieConsent,
    readStoredConsent,
    () => null
  );
  const [isBannerManuallyOpen, setIsBannerManuallyOpen] = useState(false);
  const isBannerOpen = consent === null || isBannerManuallyOpen;

  const accept = () => {
    persistConsent('accepted');
    setIsBannerManuallyOpen(false);
  };

  const reject = () => {
    persistConsent('rejected');
    setIsBannerManuallyOpen(false);
  };

  const openBanner = () => {
    setIsBannerManuallyOpen(true);
  };

  const closeBanner = () => {
    if (consent !== null) {
      setIsBannerManuallyOpen(false);
    }
  };

  return (
    <CookieConsentContext.Provider value={{ consent, openBanner }}>
      {children}
      {isBannerOpen && (
        <CookieBanner
          canClose={consent !== null}
          onAccept={accept}
          onReject={reject}
          onClose={closeBanner}
        />
      )}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }

  return context;
}
