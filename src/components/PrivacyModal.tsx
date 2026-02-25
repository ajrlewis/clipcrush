interface PrivacyModalProps {
  onClose: () => void;
  onOpenCookieSettings?: () => void;
}

export function PrivacyModal({ onClose, onOpenCookieSettings }: PrivacyModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm px-6 py-10 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-xl p-5 shadow-[0_14px_48px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-white font-black text-lg">Privacy</h2>
          <button
            type="button"
            aria-label="Close privacy modal"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-white/25 bg-black/30 text-zinc-300 hover:text-white hover:border-[#00d4ff]/70 transition-all"
          >
            ×
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-zinc-200 leading-relaxed">
          <section>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#00d4ff] font-bold">Data We Collect</p>
            <p className="mt-1 text-zinc-300">
              We use Vercel Analytics for aggregate traffic metrics (for example page views, referring pages, and
              browser/device categories) only when you accept analytics cookies. We do not require user accounts or
              collect names or emails in this app.
            </p>
          </section>

          <section>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#00d4ff] font-bold">Third Parties We Call</p>
            <ul className="mt-1 space-y-1 text-zinc-300">
              <li>Vercel Analytics (`@vercel/analytics`) for site usage analytics.</li>
              <li>Deezer API (`api.deezer.com`) to search songs and fetch track metadata/previews.</li>
              <li>Wallet of Satoshi (`walletofsatoshi.com`) to generate Lightning invoices for donations.</li>
              <li>QR Server (`api.qrserver.com`) to render QR images for payment requests.</li>
            </ul>
          </section>

          <section>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#00d4ff] font-bold">How Data Is Used</p>
            <p className="mt-1 text-zinc-300">
              Data is used to run gameplay features (song lookup, donations) and monitor overall app performance and
              traffic.
            </p>
          </section>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-2">
          {onOpenCookieSettings && (
            <button
              type="button"
              onClick={onOpenCookieSettings}
              className="w-full rounded-xl border border-white/25 bg-white/[0.04] py-3 text-xs font-black uppercase tracking-[0.12em] text-zinc-200 hover:border-white/45 hover:bg-white/[0.08] transition"
            >
              Manage Cookie Consent
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-[#00d4ff]/70 bg-[#00d4ff] py-3 text-black text-xs font-black uppercase tracking-[0.12em] shadow-[0_0_18px_rgba(0,212,255,0.35)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
