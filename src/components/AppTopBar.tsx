'use client';

import Image from 'next/image';
import Link from 'next/link';

interface AppTopBarProps {
  onOpenInfo: () => void;
  onOpenDonate: () => void;
}

export function AppTopBar({ onOpenInfo, onOpenDonate }: AppTopBarProps) {
  return (
    <div className="flex items-center justify-between px-1 py-1">
      <Link href="/choose" aria-label="Go to choose page" className="flex items-center gap-3">
        <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-white/5 shadow-[0_0_28px_rgba(0,212,255,0.36)]">
          <Image
            src="/branding/logo.png"
            alt="Pass the Track logo"
            width={44}
            height={44}
            className="object-cover"
          />
        </div>
        <div className="leading-none">
          <p className="text-[15px] tracking-[0.14em] text-white font-black drop-shadow-[0_0_12px_rgba(0,212,255,0.28)]">
            PASS THE TRACK
          </p>
          <p className="mt-1 text-[10px] tracking-[0.18em] text-[#00d4ff]/90 font-bold uppercase">
            Guess the song
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/"
          aria-label="Go home"
          className="w-8 h-8 rounded-full border border-white/25 bg-white/[0.08] text-zinc-200 hover:border-[#00d4ff]/70 hover:text-white hover:shadow-[0_0_14px_rgba(0,212,255,0.28)] transition-all grid place-items-center"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
            <path d="M3 11.2 12 4l9 7.2" />
            <path d="M5.4 10.8V20h13.2v-9.2" />
            <path d="M9.8 20v-5.6h4.4V20" />
          </svg>
        </Link>

        <button
          type="button"
          aria-label="Donate Bitcoin"
          onClick={onOpenDonate}
          className="w-8 h-8 rounded-full border border-[#f7931a]/70 bg-[#f7931a]/20 text-[#f7931a] text-sm font-black hover:bg-[#f7931a]/30 hover:border-[#f8b255] hover:text-[#f8b255] hover:shadow-[0_0_14px_rgba(247,147,26,0.35)] transition-all"
        >
          ₿
        </button>

        <button
          type="button"
          aria-label="Show instructions"
          onClick={onOpenInfo}
          className="w-8 h-8 rounded-full border border-white/25 bg-white/[0.08] text-zinc-200 text-xs font-black hover:border-[#00d4ff]/70 hover:text-white hover:shadow-[0_0_14px_rgba(0,212,255,0.28)] transition-all"
        >
          i
        </button>
      </div>
    </div>
  );
}
