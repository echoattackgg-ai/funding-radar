import type { Metadata } from "next";
import { getGroupedFundingRates } from "@/lib/funding-rates";
import FundingRatesTable from "@/components/FundingRatesTable";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "All funding rates",
  description: "Every tracked coin across Binance, Bybit and OKX, sorted by spread.",
};

export default async function FundingPage() {
  const { rows, error } = await getGroupedFundingRates();

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-12">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          All funding rates
        </h1>
        <p className="mt-3 text-lg text-zinc-400">
          Every tracked coin across all exchanges, sorted by spread.
        </p>
      </div>
      <FundingRatesTable rows={rows} error={error} />
    </div>
  );
}
