import { getAllEtfData } from '@/lib/fetchDistributions';
import { getUsdToKrwRate } from '@/lib/fetchExchangeRate';
import holdings from '@/data/holdings.json';
import styles from './page.module.css';

// Revalidate page data every hour
export const revalidate = 3600;

export default async function Home() {
  const etfData = await getAllEtfData();
  const exchangeRate = await getUsdToKrwRate();
  
  let totalUsdWeeklyIncome = 0;
  let totalNetUsdWeeklyIncome = 0;

  const summaryDetails = etfData.map(etf => {
    // Array comes reversed from lib, so 0 is the newest
    const latestDist = etf.distributions && etf.distributions.length > 0 ? etf.distributions[0] : null;
    const qty = (holdings as Record<string, number>)[etf.symbol] || 0;
    
    let amount = 0;
    let latestDate = "N/A";
    
    if (latestDist) {
      amount = parseFloat(latestDist.amountPaid.replace('$', '')) || 0;
      latestDate = latestDist.payDate || latestDist.declarationDate;
    }
    
    const totalUsd = qty * amount;
    const netUsd = totalUsd * 0.85; // 15% dividend tax
    const netKrw = netUsd * exchangeRate;

    totalUsdWeeklyIncome += totalUsd;
    totalNetUsdWeeklyIncome += netUsd;
    
    return {
      symbol: etf.symbol,
      date: latestDate,
      quantity: qty,
      amountPerShare: amount,
      totalUsd,
      netUsd,
      netKrw
    };
  });
  
  const totalNetKrwWeeklyIncome = totalNetUsdWeeklyIncome * exchangeRate;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Weekly Yield Tracker</h1>
        <p>Real-time dividend distributions for your favorite ETFs</p>
      </header>

      <section className={styles.summarySection}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <h2>Expected Weekly Income (Net of 15% Tax)</h2>
            <div className={styles.totalIncome}>
              ₩{Math.round(totalNetKrwWeeklyIncome).toLocaleString()}
            </div>
            <div className={styles.exchangeRate}>
              Net USD: ${totalNetUsdWeeklyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} &nbsp;|&nbsp; Rate: 1 USD = ₩{exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>
          </div>
          
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Recent Date</th>
                  <th>Quantity</th>
                  <th>Div / Share</th>
                  <th>Total (USD)</th>
                  <th>Net (USD, -15%)</th>
                  <th>Net (KRW)</th>
                </tr>
              </thead>
              <tbody>
                {summaryDetails.map(item => (
                  <tr key={item.symbol}>
                    <td><strong>{item.symbol}</strong></td>
                    <td>{item.date}</td>
                    <td>{item.quantity.toLocaleString()}</td>
                    <td>${item.amountPerShare.toFixed(4)}</td>
                    <td>${item.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ color: "var(--text-secondary)" }}>${item.netUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className={styles.amount}>₩{Math.round(item.netKrw).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        {etfData.map((etf) => (
          <div key={etf.symbol} className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>{etf.symbol}</h2>
              <span className={styles.name}>{etf.name}</span>
            </div>
            
            <div className={styles.tableWrapper}>
              {etf.distributions && etf.distributions.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Declaration</th>
                      <th>Ex Date</th>
                      <th>Record Date</th>
                      <th>Pay Date</th>
                      <th>Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {etf.distributions.slice(0, 10).map((dist, idx) => (
                      <tr key={idx}>
                        <td>{dist.declarationDate}</td>
                        <td>{dist.exDate}</td>
                        <td>{dist.recordDate}</td>
                        <td>{dist.payDate}</td>
                        <td className={styles.amount}>{dist.amountPaid}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>
                  Data not available or could not be scraped. (Client-rendered site might require a different crawler)
                </div>
              )}
            </div>
            <a href={etf.url} target="_blank" rel="noreferrer" className={styles.link}>
              View Official Source
            </a>
          </div>
        ))}
      </section>
    </main>
  );
}
