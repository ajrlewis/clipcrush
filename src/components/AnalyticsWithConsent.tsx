'use client';

import { Analytics } from '@vercel/analytics/react';
import { useCookieConsent } from '@/context/CookieConsentContext';

export function AnalyticsWithConsent() {
  const { consent } = useCookieConsent();
  if (consent !== 'accepted') {
    return null;
  }

  return <Analytics />;
}
