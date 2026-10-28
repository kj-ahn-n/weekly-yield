export interface Distribution {
  declarationDate: string;
  exDate: string;
  recordDate: string;
  payDate: string;
  amountPaid: string;
}

export interface YahooDividendEvent {
  date: Date;
  amount: number;
}

export function parseYahooDividends(events: readonly YahooDividendEvent[]): Distribution[] {
  return events
    .filter(({ date, amount }) =>
      date instanceof Date &&
      Number.isFinite(date.getTime()) &&
      Number.isFinite(amount) &&
      amount > 0
    )
    .map(({ date, amount }) => ({
      declarationDate: '',
      exDate: date.toISOString().slice(0, 10),
      recordDate: '',
      payDate: '',
      amountPaid: `$${amount.toFixed(6)}`,
    }))
    .sort((a, b) => b.exDate.localeCompare(a.exDate));
}

export type RoundhillRow = (string | number | null)[];

export function parseRoundhillDistributions(rows: readonly RoundhillRow[]): Distribution[] {
  return rows
    .slice()
    .reverse()
    .filter((row) => Array.isArray(row) && row.length >= 5)
    .map((row) => {
      const amount = String(row[4] ?? '').replace(/[$,]/g, '').trim();
      if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return null;

      return {
        declarationDate: String(row[0] ?? ''),
        exDate: String(row[1] ?? ''),
        recordDate: String(row[2] ?? ''),
        payDate: String(row[3] ?? ''),
        amountPaid: `$${amount}`,
      };
    })
    .filter((row): row is Distribution => row !== null)
    .sort((a, b) => {
      const aTime = Date.parse(a.exDate || a.payDate);
      const bTime = Date.parse(b.exDate || b.payDate);
      return Number.isFinite(aTime) && Number.isFinite(bTime) ? bTime - aTime : 0;
    });
}
