import { getGroupedFundingRates } from "@/lib/funding-rates";
import FundingRatesTable from "@/components/FundingRatesTable";

export const revalidate = 0;

export default async function FundingPage() {
  const { rows, error } = await getGroupedFundingRates();

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">
        All funding rates
      </h1>
      <FundingRatesTable rows={rows} error={error} />
    </div>
  );
}
