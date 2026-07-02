import { formatCardNumber, formatExpiry, maskCardNumber } from "@/lib/banking-format";
import { Wifi } from "lucide-react";
import { useState } from "react";
import type { Card as CardType } from "@/lib/banking.functions";

export function AtmCard({ card, revealed: initialRevealed = false }: { card: CardType; revealed?: boolean }) {
  const [revealed, setRevealed] = useState(initialRevealed);
  return (
    <div className="relative aspect-[1.586] w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a2a6c] via-[#1546b8] to-[#3b82f6] p-5 text-white shadow-xl">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-white/5" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/70">Northline Bank</p>
            <p className="text-sm font-semibold">{card.brand}</p>
          </div>
          <Wifi className="h-5 w-5 rotate-90 text-white/80" />
        </div>

        <div className="h-8 w-11 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500/80" />

        <div>
          <p className="font-mono text-lg tracking-widest">
            {revealed ? formatCardNumber(card.card_number) : maskCardNumber(card.card_number)}
          </p>
          <div className="mt-3 flex items-end justify-between gap-4 text-[11px] uppercase tracking-widest">
            <div>
              <p className="text-white/60">Cardholder</p>
              <p className="text-sm font-medium tracking-wider">{card.cardholder_name}</p>
            </div>
            <div>
              <p className="text-white/60">Expires</p>
              <p className="text-sm font-medium">{formatExpiry(card.expiry_month, card.expiry_year)}</p>
            </div>
            <div>
              <p className="text-white/60">CVC</p>
              <p className="text-sm font-medium">{revealed ? card.cvc : "•••"}</p>
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        className="absolute right-3 top-3 rounded-full bg-white/15 px-2 py-1 text-[10px] uppercase tracking-widest text-white/90 backdrop-blur transition hover:bg-white/25"
      >
        {revealed ? "Hide" : "Show"}
      </button>
    </div>
  );
}
