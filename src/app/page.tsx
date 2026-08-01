import FundingRatesTable from "@/components/FundingRatesTable";
import LiquidationCalculator from "@/components/LiquidationCalculator";

export const revalidate = 0;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">
        Funding Radar
      </h1>
      <FundingRatesTable />
      <LiquidationCalculator />
    </div>
  );
}
