import { NextResponse } from 'next/server';

const WOS_USERNAME = 'filthydash98';
const WOS_DOMAIN = 'walletofsatoshi.com';

interface LnurlPayRequestConfig {
  callback: string;
}

function isLnurlPayRequestConfig(value: unknown): value is LnurlPayRequestConfig {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as Partial<LnurlPayRequestConfig>).callback === 'string'
  );
}

export const dynamic = 'force-dynamic';

async function fetchWosCallbackUrl() {
  const response = await fetch(
    `https://${WOS_DOMAIN}/.well-known/lnurlp/${WOS_USERNAME}`,
    { cache: 'no-store' },
  );

  if (!response.ok) {
    throw new Error(`Upstream WoS endpoint failed (${response.status})`);
  }

  const payload: unknown = await response.json();
  if (!isLnurlPayRequestConfig(payload)) {
    throw new Error('Upstream WoS endpoint returned invalid callback config');
  }

  return payload.callback;
}

function copyQueryParam(
  source: URLSearchParams,
  target: URLSearchParams,
  param: 'amount' | 'comment' | 'nostr' | 'lnurl',
) {
  const value = source.get(param);
  if (value) {
    target.set(param, value);
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const amount = requestUrl.searchParams.get('amount');

  if (!amount) {
    return NextResponse.json(
      { status: 'ERROR', reason: 'amount is required (in millisats).' },
      {
        status: 400,
        headers: {
          'access-control-allow-origin': '*',
          'cache-control': 'no-store',
        },
      },
    );
  }

  try {
    const callback = await fetchWosCallbackUrl();
    const upstreamUrl = new URL(callback);

    copyQueryParam(requestUrl.searchParams, upstreamUrl.searchParams, 'amount');
    copyQueryParam(requestUrl.searchParams, upstreamUrl.searchParams, 'comment');
    copyQueryParam(requestUrl.searchParams, upstreamUrl.searchParams, 'nostr');
    copyQueryParam(requestUrl.searchParams, upstreamUrl.searchParams, 'lnurl');

    const response = await fetch(upstreamUrl.toString(), { cache: 'no-store' });
    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        'access-control-allow-origin': '*',
        'cache-control': 'no-store',
        'content-type': response.headers.get('content-type') ?? 'application/json; charset=utf-8',
      },
    });
  } catch {
    return NextResponse.json(
      { status: 'ERROR', reason: 'Unable to generate Lightning invoice right now.' },
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
