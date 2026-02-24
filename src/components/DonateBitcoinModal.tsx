import Image from 'next/image';
import { useMemo, useRef, useState, type TouchEvent } from 'react';

interface DonateBitcoinModalProps {
  onClose: () => void;
}

const BTC_DONATION_ADDRESS = 'bc1qdgk65xvc3c757mfkzwl7tt640j6xupuucadfdp';
const LIGHTNING_ADDRESS = 'pay@passthetrack.com';
const LIGHTNING_PRESET_AMOUNTS = [500, 1000, 5000] as const;
const PAYMENT_METHODS = ['btc', 'lightningAddress', 'lightningInvoice'] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

interface LnurlInvoiceSuccessResponse {
  pr: string;
}

interface LnurlInvoiceErrorResponse {
  status: 'ERROR';
  reason?: string;
}

function isLnurlInvoiceSuccessResponse(payload: unknown): payload is LnurlInvoiceSuccessResponse {
  return Boolean(payload) && typeof payload === 'object' && typeof (payload as { pr?: unknown }).pr === 'string';
}

function isLnurlInvoiceErrorResponse(payload: unknown): payload is LnurlInvoiceErrorResponse {
  return (
    Boolean(payload) &&
    typeof payload === 'object' &&
    (payload as { status?: unknown }).status === 'ERROR'
  );
}

function formatCompactPaymentValue(value: string): string {
  if (value.length <= 36) {
    return value;
  }

  return `${value.slice(0, 18)}...${value.slice(-12)}`;
}

export function DonateBitcoinModal({ onClose }: DonateBitcoinModalProps) {
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('btc');
  const [copyStatus, setCopyStatus] = useState<{
    btc: 'idle' | 'copied' | 'failed';
    lightning: 'idle' | 'copied' | 'failed';
  }>({
    btc: 'idle',
    lightning: 'idle',
  });
  const [invoiceCopyStatus, setInvoiceCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [lightningAmountSats, setLightningAmountSats] = useState('1000');
  const [invoiceStatus, setInvoiceStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [lightningInvoice, setLightningInvoice] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const activeMethodIndex = PAYMENT_METHODS.indexOf(activeMethod);
  const btcQrSrc = useMemo(() => {
    const encoded = encodeURIComponent(BTC_DONATION_ADDRESS);
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encoded}`;
  }, []);
  const lightningAddressQrSrc = useMemo(() => {
    const paymentValue = `lightning:${LIGHTNING_ADDRESS}`;
    const encoded = encodeURIComponent(paymentValue);
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encoded}`;
  }, []);
  const lightningInvoiceQrSrc = useMemo(() => {
    if (!lightningInvoice) {
      return null;
    }

    const paymentValue = `lightning:${lightningInvoice}`;
    const encoded = encodeURIComponent(paymentValue);
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encoded}`;
  }, [lightningInvoice]);

  const handleCopyAddress = async (kind: 'btc' | 'lightning', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus((current) => ({ ...current, [kind]: 'copied' }));
    } catch {
      setCopyStatus((current) => ({ ...current, [kind]: 'failed' }));
    }
  };

  const handleCopyInvoice = async () => {
    if (!lightningInvoice) {
      return;
    }

    try {
      await navigator.clipboard.writeText(lightningInvoice);
      setInvoiceCopyStatus('copied');
    } catch {
      setInvoiceCopyStatus('failed');
    }
  };

  const handleLightningAmountChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    setLightningAmountSats(digitsOnly);
    setLightningInvoice(null);
    setInvoiceStatus('idle');
    setInvoiceError(null);
    setInvoiceCopyStatus('idle');
  };

  const handlePresetAmount = (amountSats: number) => {
    setLightningAmountSats(String(amountSats));
    setLightningInvoice(null);
    setInvoiceStatus('idle');
    setInvoiceError(null);
    setInvoiceCopyStatus('idle');
  };

  const handleGenerateInvoice = async () => {
    const amountSats = Number.parseInt(lightningAmountSats, 10);
    if (!Number.isFinite(amountSats) || amountSats < 1) {
      setInvoiceStatus('error');
      setInvoiceError('Enter a valid amount in sats.');
      setLightningInvoice(null);
      return;
    }

    const amountMsats = amountSats * 1000;
    setInvoiceStatus('loading');
    setInvoiceError(null);
    setLightningInvoice(null);
    setInvoiceCopyStatus('idle');

    try {
      const response = await fetch(`/api/lnurl/callback?amount=${amountMsats}`);
      const payload: unknown = await response.json();

      if (!response.ok) {
        const message = isLnurlInvoiceErrorResponse(payload) && payload.reason
          ? payload.reason
          : 'Could not create invoice right now.';
        setInvoiceStatus('error');
        setInvoiceError(message);
        return;
      }

      if (!isLnurlInvoiceSuccessResponse(payload)) {
        setInvoiceStatus('error');
        setInvoiceError('Unexpected invoice response from server.');
        return;
      }

      setLightningInvoice(payload.pr);
      setInvoiceStatus('ready');
    } catch {
      setInvoiceStatus('error');
      setInvoiceError('Network error while creating invoice.');
    }
  };

  const handleSlideTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleSlideTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;

    if (startX == null || endX == null) {
      return;
    }

    const swipeDistance = endX - startX;
    const swipeThreshold = 40;
    if (swipeDistance > swipeThreshold) {
      const previousMethod = PAYMENT_METHODS[Math.max(activeMethodIndex - 1, 0)];
      setActiveMethod(previousMethod);
    } else if (swipeDistance < -swipeThreshold) {
      const nextMethod = PAYMENT_METHODS[Math.min(activeMethodIndex + 1, PAYMENT_METHODS.length - 1)];
      setActiveMethod(nextMethod);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm px-6 py-10 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-xl p-4 shadow-[0_14px_48px_rgba(0,0,0,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-white font-black text-lg">Support Pass the Track</h2>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-zinc-300">
              Bitcoin On-Chain + Lightning
            </p>
          </div>
          <button
            type="button"
            aria-label="Close Bitcoin donation modal"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-white/25 bg-black/30 text-zinc-300 hover:text-white hover:border-[#00d4ff]/70 transition-all"
          >
            ×
          </button>
        </div>

        <p className="mt-3 text-sm text-zinc-200/90">
          Pick a payment method. Swipe on mobile or use tabs.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl border border-white/15 bg-black/30 p-1">
          <button
            type="button"
            onClick={() => setActiveMethod('btc')}
            className={`rounded-lg py-2 text-[9px] font-black uppercase tracking-[0.12em] transition ${
              activeMethod === 'btc'
                ? 'bg-[#f7931a] text-black'
                : 'bg-black/20 text-zinc-300 hover:bg-black/35 hover:text-white'
            }`}
          >
            On-Chain
          </button>
          <button
            type="button"
            onClick={() => setActiveMethod('lightningAddress')}
            className={`rounded-lg py-2 text-[9px] font-black uppercase tracking-[0.12em] transition ${
              activeMethod === 'lightningAddress'
                ? 'bg-[#00d4ff] text-black'
                : 'bg-black/20 text-zinc-300 hover:bg-black/35 hover:text-white'
            }`}
          >
            LN Address
          </button>
          <button
            type="button"
            onClick={() => setActiveMethod('lightningInvoice')}
            className={`rounded-lg py-2 text-[9px] font-black uppercase tracking-[0.12em] transition ${
              activeMethod === 'lightningInvoice'
                ? 'bg-[#00d4ff] text-black'
                : 'bg-black/20 text-zinc-300 hover:bg-black/35 hover:text-white'
            }`}
          >
            LN Invoice
          </button>
        </div>

        <div className="mt-3 overflow-hidden" onTouchStart={handleSlideTouchStart} onTouchEnd={handleSlideTouchEnd}>
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${activeMethodIndex * 100}%)` }}
          >
            <section className="w-full shrink-0">
              <div className="rounded-xl border border-white/15 bg-black/35 p-3 grid place-items-center">
                <Image
                  src={btcQrSrc}
                  alt="Bitcoin donation address QR code"
                  width={176}
                  height={176}
                  className="w-44 h-44 rounded-lg"
                />
              </div>
              <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#f7931a] font-bold">BTC Address</p>
              <div className="mt-2 flex items-center gap-2">
                <p
                  className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm text-zinc-100 font-mono truncate"
                  title={BTC_DONATION_ADDRESS}
                >
                  {formatCompactPaymentValue(BTC_DONATION_ADDRESS)}
                </p>
                <button
                  type="button"
                  aria-label="Copy bitcoin address"
                  onClick={() => handleCopyAddress('btc', BTC_DONATION_ADDRESS)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#f7931a]/70 bg-[#f7931a]/20 text-[#ffd59b] hover:bg-[#f7931a]/30 transition"
                >
                  {copyStatus.btc === 'copied' ? (
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 10.5l4 4L16 6.5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="7" y="3.5" width="9" height="11" rx="1.5" />
                      <path d="M4 6.5V15a1.5 1.5 0 0 0 1.5 1.5H13" />
                    </svg>
                  )}
                </button>
              </div>
              {copyStatus.btc === 'copied' && (
                <p className="mt-2 text-xs text-[#ffd59b]">Copied to clipboard.</p>
              )}
              {copyStatus.btc === 'failed' && (
                <p className="mt-2 text-xs text-rose-300">Copy failed. Try again.</p>
              )}
              <a
                href={`bitcoin:${BTC_DONATION_ADDRESS}`}
                className="mt-2 block w-full rounded-xl border border-white/20 bg-black/20 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-zinc-200 hover:border-[#f7931a]/60 hover:text-[#ffd59b] transition"
              >
                Open In Wallet App
              </a>
            </section>

            <section className="w-full shrink-0">
              <div className="rounded-xl border border-white/15 bg-black/35 p-3 grid place-items-center">
                <Image
                  src={lightningAddressQrSrc}
                  alt="Lightning address QR code"
                  width={176}
                  height={176}
                  className="w-44 h-44 rounded-lg"
                />
              </div>

              <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#00d4ff] font-bold">Lightning Address</p>
              <div className="mt-2 flex items-center gap-2">
                <p
                  className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm text-zinc-100 font-mono truncate"
                  title={LIGHTNING_ADDRESS}
                >
                  {formatCompactPaymentValue(LIGHTNING_ADDRESS)}
                </p>
                <button
                  type="button"
                  aria-label="Copy lightning address"
                  onClick={() => handleCopyAddress('lightning', LIGHTNING_ADDRESS)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#00d4ff]/70 bg-[#00d4ff]/20 text-[#8beeff] hover:bg-[#00d4ff]/30 transition"
                >
                  {copyStatus.lightning === 'copied' ? (
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 10.5l4 4L16 6.5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="7" y="3.5" width="9" height="11" rx="1.5" />
                      <path d="M4 6.5V15a1.5 1.5 0 0 0 1.5 1.5H13" />
                    </svg>
                  )}
                </button>
              </div>
              {copyStatus.lightning === 'copied' && (
                <p className="mt-2 text-xs text-[#8beeff]">Copied to clipboard.</p>
              )}
              {copyStatus.lightning === 'failed' && (
                <p className="mt-2 text-xs text-rose-300">Copy failed. Try again.</p>
              )}
              <a
                href={`lightning:${LIGHTNING_ADDRESS}`}
                className="mt-2 block w-full rounded-xl border border-white/20 bg-black/20 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-zinc-200 hover:border-[#00d4ff]/60 hover:text-[#8beeff] transition"
              >
                Open In Wallet App
              </a>
            </section>

            <section className="w-full shrink-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#00d4ff] font-bold">Invoice Amount (Sats)</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {LIGHTNING_PRESET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handlePresetAmount(amount)}
                    className={`rounded-lg border py-2 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                      lightningAmountSats === String(amount)
                        ? 'border-[#00d4ff]/80 bg-[#00d4ff]/20 text-[#8beeff]'
                        : 'border-white/20 bg-black/25 text-zinc-200 hover:border-[#00d4ff]/50'
                    }`}
                  >
                    {amount.toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={lightningAmountSats}
                onChange={(event) => handleLightningAmountChange(event.target.value)}
                placeholder="Enter sats"
                className="mt-2 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#00d4ff]/70"
              />
              <button
                type="button"
                onClick={handleGenerateInvoice}
                disabled={invoiceStatus === 'loading'}
                className="mt-2 w-full rounded-xl border border-[#00d4ff]/80 bg-[#00d4ff] py-3 text-black text-xs font-black uppercase tracking-[0.12em] shadow-[0_0_18px_rgba(0,212,255,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {invoiceStatus === 'loading' ? 'Generating Invoice...' : 'Generate Invoice'}
              </button>
              {invoiceStatus === 'error' && (
                <p className="mt-2 text-xs text-rose-300">{invoiceError}</p>
              )}
              {invoiceStatus === 'ready' && lightningInvoice && (
                <p className="mt-2 text-xs text-[#8beeff]">
                  Invoice ready for {Number.parseInt(lightningAmountSats || '0', 10).toLocaleString()} sats.
                </p>
              )}

              {lightningInvoice && lightningInvoiceQrSrc ? (
                <>
                  <div className="mt-3 rounded-xl border border-white/15 bg-black/35 p-3 grid place-items-center">
                    <Image
                      src={lightningInvoiceQrSrc}
                      alt="Lightning invoice QR code"
                      width={176}
                      height={176}
                      className="w-44 h-44 rounded-lg"
                    />
                  </div>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#00d4ff] font-bold">Lightning Invoice</p>
                  <div className="mt-2 flex items-center gap-2">
                    <p
                      className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm text-zinc-100 font-mono truncate"
                      title={lightningInvoice}
                    >
                      {formatCompactPaymentValue(lightningInvoice)}
                    </p>
                    <button
                      type="button"
                      aria-label="Copy lightning invoice"
                      onClick={() => {
                        void handleCopyInvoice();
                      }}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#00d4ff]/70 bg-[#00d4ff]/20 text-[#8beeff] hover:bg-[#00d4ff]/30 transition"
                    >
                      {invoiceCopyStatus === 'copied' ? (
                        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 10.5l4 4L16 6.5" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <rect x="7" y="3.5" width="9" height="11" rx="1.5" />
                          <path d="M4 6.5V15a1.5 1.5 0 0 0 1.5 1.5H13" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {invoiceCopyStatus === 'copied' && (
                    <p className="mt-2 text-xs text-[#8beeff]">Copied to clipboard.</p>
                  )}
                  {invoiceCopyStatus === 'failed' && (
                    <p className="mt-2 text-xs text-rose-300">Copy failed. Try again.</p>
                  )}
                  <a
                    href={`lightning:${lightningInvoice}`}
                    className="mt-2 block w-full rounded-xl border border-white/20 bg-black/20 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-zinc-200 hover:border-[#00d4ff]/60 hover:text-[#8beeff] transition"
                  >
                    Open In Wallet App
                  </a>
                </>
              ) : (
                <p className="mt-3 rounded-lg border border-white/15 bg-black/35 p-3 text-xs text-zinc-300">
                  Generate an invoice to show a QR code and copy-ready payment request.
                </p>
              )}
            </section>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            aria-label="Show on-chain payment details"
            onClick={() => setActiveMethod('btc')}
            className={`h-1.5 rounded-full transition-all ${activeMethod === 'btc' ? 'w-7 bg-[#f7931a]' : 'w-1.5 bg-white/30'}`}
          />
          <button
            type="button"
            aria-label="Show lightning address details"
            onClick={() => setActiveMethod('lightningAddress')}
            className={`h-1.5 rounded-full transition-all ${
              activeMethod === 'lightningAddress' ? 'w-7 bg-[#00d4ff]' : 'w-1.5 bg-white/30'
            }`}
          />
          <button
            type="button"
            aria-label="Show lightning invoice details"
            onClick={() => setActiveMethod('lightningInvoice')}
            className={`h-1.5 rounded-full transition-all ${
              activeMethod === 'lightningInvoice' ? 'w-7 bg-[#00d4ff]' : 'w-1.5 bg-white/30'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
