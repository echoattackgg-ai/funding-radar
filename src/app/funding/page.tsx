import { getLatestFundingRates } from "@/lib/funding-rates";
import RelativeTime from "@/components/RelativeTime";

export const revalidate = 0;

export default async function FundingPage() {
  const rows = await getLatestFundingRates();

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">
        Все ставки фандинга
      </h1>

      <div className="w-full max-w-3xl rounded-xl border border-white/10 bg-white/5 p-6">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-400">Данных пока нет.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-zinc-400 uppercase">
                  <th className="pb-2 pr-4 font-medium">Биржа</th>
                  <th className="pb-2 pr-4 font-medium">Тикер</th>
                  <th className="pb-2 pr-4 font-medium">Ставка</th>
                  <th className="pb-2 pr-4 font-medium">Интервал, ч</th>
                  <th className="pb-2 pr-4 font-medium">APR</th>
                  <th className="pb-2 font-medium">Обновлено</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.exchange}:${row.ticker}`}>
                    <td className="py-2 pr-4">{row.exchange}</td>
                    <td className="py-2 pr-4">{row.ticker}</td>
                    <td className="py-2 pr-4">
                      {row.rate_percent.toFixed(4)}%
                    </td>
                    <td className="py-2 pr-4">{row.interval_hours}</td>
                    <td className="py-2 pr-4">
                      {row.apr_percent.toFixed(2)}%
                    </td>
                    <td className="py-2 text-zinc-400">
                      <RelativeTime dateIso={row.fetched_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
