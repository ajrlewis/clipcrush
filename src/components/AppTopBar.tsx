'use client';

import Image from 'next/image';
import Link from 'next/link';

interface AppTopBarProps {
  onOpenInfo: () => void;
  onOpenDonate: () => void;
}

export function AppTopBar({ onOpenInfo, onOpenDonate }: AppTopBarProps) {
  return (
    <div className="flex items-center justify-between px-1 py-1.5">
      <Link href="/choose" aria-label="Go to choose page" className="flex items-center gap-3.5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/15 bg-zinc-900 shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
          <Image
            src="/branding/logo.png"
            alt="Pass the Track logo"
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
        <div className="leading-none">
          <p className="text-[15px] tracking-[0.14em] text-white font-black drop-shadow-[0_0_12px_rgba(0,212,255,0.22)]">
            PASS THE TRACK
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Donate Bitcoin"
          onClick={onOpenDonate}
          className="h-8 w-8 rounded-full border border-[#f7931a]/70 bg-[#f7931a]/15 text-sm font-black text-[#f7931a] transition-all hover:border-[#f8b255] hover:bg-[#f7931a]/25 hover:text-[#f8b255]"
        >
          ₿
        </button>

        <button
          type="button"
          aria-label="Show instructions"
          onClick={onOpenInfo}
          className="h-8 w-8 rounded-full border border-white/20 bg-white/[0.06] text-xs font-black text-zinc-200 transition-all hover:border-[#00d4ff]/60 hover:bg-[#00d4ff]/10 hover:text-white"
        >
          i
        </button>
      </div>
    </div>
  );
}
