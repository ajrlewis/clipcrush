import Image from 'next/image';
import { useMemo, useState } from 'react';

interface DonateBitcoinModalProps {
  onClose: () => void;
}

const BTC_DONATION_ADDRESS = 'btcb1....dalifj';

export function DonateBitcoinModal({ onClose }: DonateBitcoinModalProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const qrSrc = useMemo(() => {
    const encoded = encodeURIComponent(BTC_DONATION_ADDRESS);
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encoded}`;
  }, []);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(BTC_DONATION_ADDRESS);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm px-6 py-10 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#f7931a]/35 bg-[#1f1407]/80 backdrop-blur-xl p-5 shadow-[0_14px_48px_rgba(0,0,0,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-white font-black text-lg">Donate Bitcoin</h2>
          <button
            type="button"
            aria-label="Close Bitcoin donation modal"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-[#f7931a]/45 bg-black/30 text-[#f8c06e] hover:text-[#ffd59b] hover:border-[#f7931a] transition-all"
          >
            ×
          </button>
        </div>

        <p className="mt-2 text-sm text-[#ffd59b]/90">
          Support Pass the Track by donating to this Bitcoin address.
        </p>

        <div className="mt-4 rounded-xl border border-[#f7931a]/30 bg-black/35 p-4 grid place-items-center">
          <Image
            src={qrSrc}
            alt="Bitcoin donation address QR code"
            width={208}
            height={208}
            className="w-52 h-52 rounded-lg"
          />
        </div>

        <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-[#f7931a] font-bold">Address</p>
        <p className="mt-2 rounded-lg border border-[#f7931a]/30 bg-black/35 p-3 text-sm text-[#ffe6c6] font-mono break-all">
          {BTC_DONATION_ADDRESS}
        </p>

        <button
          type="button"
          onClick={handleCopyAddress}
          className="mt-4 w-full rounded-xl border border-[#f7931a]/80 bg-[#f7931a] py-3 text-black text-xs font-black uppercase tracking-[0.12em] shadow-[0_0_18px_rgba(247,147,26,0.35)]"
        >
          {copyStatus === 'copied' ? 'Copied' : copyStatus === 'failed' ? 'Copy Failed' : 'Copy Address'}
        </button>
      </div>
    </div>
  );
}
