import FundingRatesTable from "@/components/FundingRatesTable";
import LiquidationCalculator from "@/components/LiquidationCalculator";
import { getGroupedFundingRates } from "@/lib/funding-rates";

export const revalidate = 0;

export default async function Home() {
  const { rows, error } = await getGroupedFundingRates();

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-12">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Funding Radar
        </h1>
        <p className="mt-3 text-lg text-zinc-400">
          The same position can cost you 15% a year on one exchange and pay
          you 10% on another. We track the difference in real time.
        </p>
      </div>
      <FundingRatesTable rows={rows} error={error} limit={5} seeAllHref="/funding" />
      <LiquidationCalculator />
    </div>
  );
}
