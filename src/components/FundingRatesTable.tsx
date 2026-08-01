import { getLatestFundingRates } from "@/lib/funding-rates";

export default async function FundingRatesTable() {
  const rows = await getLatestFundingRates();

  if (rows.length === 0) {
    return (
      <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-2 text-lg font-medium">Фандинг по биржам</h2>
        <p className="text-sm text-zinc-400">Данных пока нет.</p>
      </div>
    );
  }

  const aprValues = rows.map((row) => row.apr_percent);
  const maxApr = Math.max(...aprValues);
  const minApr = Math.min(...aprValues);
  const spread = maxApr - minApr;
  const hasSpread = rows.length > 1 && maxApr !== minApr;

  return (
    <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-white/5 p-6">
      <h2 className="mb-4 text-lg font-medium">Фандинг по биржам</h2>

      {hasSpread && (
        <div className="mb-4 rounded-lg bg-white/5 p-3">
          <p className="text-sm text-zinc-400">
            Спред между биржами:{" "}
            <span className="font-semibold text-foreground">
              {spread.toFixed(2)} п.п.
            </span>
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-zinc-400 uppercase">
              <th className="pb-2 pr-4 font-medium">Биржа</th>
              <th className="pb-2 pr-4 font-medium">Тикер</th>
              <th className="pb-2 pr-4 font-medium">Ставка, %</th>
              <th className="pb-2 pr-4 font-medium">Интервал, ч</th>
              <th className="pb-2 font-medium">APR, %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isMax = hasSpread && row.apr_percent === maxApr;
              const isMin = hasSpread && row.apr_percent === minApr;

              return (
                <tr
                  key={`${row.exchange}:${row.ticker}`}
                  className={
                    isMax
                      ? "bg-green-500/10 text-green-400"
                      : isMin
                        ? "bg-red-500/10 text-red-400"
                        : ""
                  }
                >
                  <td className="py-2 pr-4">{row.exchange}</td>
                  <td className="py-2 pr-4">{row.ticker}</td>
                  <td className="py-2 pr-4">{row.rate_percent.toFixed(4)}</td>
                  <td className="py-2 pr-4">{row.interval_hours}</td>
                  <td className="py-2 font-medium">
                    {row.apr_percent.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
