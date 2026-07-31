type Coin = {
  label: string;
  top: string;
  left: string;
  size: number;
};

const LEFT_COINS: Coin[] = [
  { label: "₿", top: "5%", left: "58%", size: 72 },
  { label: "ETH", top: "17%", left: "18%", size: 54 },
  { label: "SOL", top: "31%", left: "60%", size: 46 },
  { label: "BNB", top: "46%", left: "14%", size: 58 },
  { label: "XRP", top: "61%", left: "56%", size: 42 },
  { label: "ADA", top: "75%", left: "20%", size: 50 },
  { label: "DOGE", top: "89%", left: "58%", size: 44 },
];

const RIGHT_COINS: Coin[] = [
  { label: "Ξ", top: "9%", left: "38%", size: 66 },
  { label: "DOT", top: "22%", left: "68%", size: 44 },
  { label: "AVAX", top: "37%", left: "30%", size: 50 },
  { label: "LINK", top: "52%", left: "62%", size: 48 },
  { label: "LTC", top: "67%", left: "28%", size: 42 },
  { label: "TRX", top: "80%", left: "60%", size: 46 },
  { label: "ATOM", top: "92%", left: "34%", size: 44 },
];

// Смешанный чёрно-бело-серый фон на всю ширину экрана: несколько наложенных
// радиальных пятен поверх тёмной основы, без единого сплошного цвета.
// Один общий слой на весь viewport — чтобы не было шва между боками и центром.
const MIXED_BACKGROUND = [
  "radial-gradient(circle at 8% 12%, rgba(255,255,255,0.10), transparent 28%)",
  "radial-gradient(circle at 92% 22%, rgba(255,255,255,0.07), transparent 30%)",
  "radial-gradient(circle at 12% 58%, rgba(160,160,160,0.13), transparent 32%)",
  "radial-gradient(circle at 88% 68%, rgba(255,255,255,0.06), transparent 30%)",
  "radial-gradient(circle at 50% 45%, rgba(140,140,140,0.06), transparent 45%)",
  "linear-gradient(180deg, rgba(30,30,30,0.7), rgba(70,70,70,0.35) 50%, rgba(5,5,5,0.75))",
].join(", ");

function Bubble({ coin, delayIndex }: { coin: Coin; delayIndex: number }) {
  const fontSize = Math.max(9, Math.round(coin.size * 0.24));

  return (
    <div
      className="crypto-bubble absolute flex items-center justify-center rounded-full border border-white/25 bg-white/10 font-semibold text-white/85 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-md backdrop-saturate-150"
      style={{
        top: coin.top,
        left: coin.left,
        width: coin.size,
        height: coin.size,
        fontSize,
        animationDuration: `${6 + (delayIndex % 4)}s`,
        animationDelay: `${delayIndex * 0.5}s`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-white/5 to-transparent opacity-70" />
      <span className="relative z-10">{coin.label}</span>
    </div>
  );
}

function SidePanel({
  side,
  coins,
}: {
  side: "left" | "right";
  coins: Coin[];
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-y-0 -z-10 hidden w-56 overflow-hidden lg:block ${
        side === "left" ? "left-0" : "right-0"
      }`}
    >
      {coins.map((coin, i) => (
        <Bubble key={coin.label} coin={coin} delayIndex={i} />
      ))}
    </div>
  );
}

export default function CryptoSideBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-20"
        style={{ background: MIXED_BACKGROUND }}
      />
      <SidePanel side="left" coins={LEFT_COINS} />
      <SidePanel side="right" coins={RIGHT_COINS} />
    </>
  );
}
