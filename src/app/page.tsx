import { getAllEtfData } from '@/lib/fetchDistributions';
import styles from './page.module.css';

// Revalidate page data every hour
export const revalidate = 3600;

export default async function Home() {
  const etfData = await getAllEtfData();
  
  // Debug output during build/server run
  console.log("Scraped ETF Data:", JSON.stringify(etfData, null, 2));

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Weekly Yield Tracker</h1>
        <p>Real-time dividend distributions for your favorite ETFs</p>
      </header>

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
