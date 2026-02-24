import { NextResponse } from 'next/server';

const ALIAS = 'pay';
const WOS_USERNAME = 'filthydash98';
const WOS_DOMAIN = 'walletofsatoshi.com';

interface LnurlPayRequestConfig {
  callback: string;
  maxSendable: number;
  minSendable: number;
  metadata: string;
  commentAllowed?: number;
  tag: 'payRequest';
  allowsNostr?: boolean;
  nostrPubkey?: string;
}

export const dynamic = 'force-dynamic';

function isLnurlPayRequestConfig(value: unknown): value is LnurlPayRequestConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const data = value as Partial<LnurlPayRequestConfig>;
  return (
    typeof data.callback === 'string' &&
    typeof data.maxSendable === 'number' &&
    typeof data.minSendable === 'number' &&
    typeof data.metadata === 'string' &&
    data.tag === 'payRequest'
  );
}

async function fetchWosLnurlConfig() {
  const response = await fetch(
    `https://${WOS_DOMAIN}/.well-known/lnurlp/${WOS_USERNAME}`,
    { cache: 'no-store' },
  );

  if (!response.ok) {
    throw new Error(`Upstream WoS endpoint failed (${response.status})`);
  }

  const payload: unknown = await response.json();
  if (!isLnurlPayRequestConfig(payload)) {
    throw new Error('Upstream WoS endpoint returned invalid LNURL-pay config');
  }

  return payload;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const host = requestUrl.host;
  const callbackUrl = new URL('/api/lnurl/callback', request.url);
  const aliasAddress = `${ALIAS}@${host}`;

  try {
    const upstream = await fetchWosLnurlConfig();
    const metadata = JSON.stringify([
      ['text/plain', `Pay to ${aliasAddress}`],
      ['text/identifier', aliasAddress],
    ]);

    return NextResponse.json(
      {
        ...upstream,
        callback: callbackUrl.toString(),
        metadata,
      } satisfies LnurlPayRequestConfig,
      {
        headers: {
          'access-control-allow-origin': '*',
          'cache-control': 'no-store',
        },
      },
    );
  } catch {
    return NextResponse.json(
      { status: 'ERROR', reason: 'Unable to resolve payment endpoint right now.' },
      {
        status: 502,
        headers: {
          'access-control-allow-origin': '*',
          'cache-control': 'no-store',
        },
      },
    );
  }
}
