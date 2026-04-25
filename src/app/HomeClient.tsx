'use client';

import { useState, useEffect } from 'react';
import defaultHoldings from '@/data/holdings.json';
import styles from './page.module.css';

type EtfData = {
  symbol: string;
  name: string;
  distributions: any[];
  url: string;
};

type HomeClientProps = {
  etfData: EtfData[];
  exchangeRate: number;
};

export default function HomeClient({ etfData, exchangeRate }: HomeClientProps) {
  const [holdings, setHoldings] = useState<Record<string, number | string>>(defaultHoldings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('etf_holdings');
    if (saved) {
      try {
        setHoldings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse holdings', e);
      }
    }
  }, []);

  const handleHoldingChange = (symbol: string, value: string) => {
    const newHoldings = { ...holdings };
    if (value === '') {
      newHoldings[symbol] = '';
    } else {
      newHoldings[symbol] = Number(value);
    }
    setHoldings(newHoldings);
    localStorage.setItem('etf_holdings', JSON.stringify(newHoldings));
  };

  let totalUsdWeeklyIncome = 0;
  let totalNetUsdWeeklyIncome = 0;

  const summaryDetails = etfData.map(etf => {
    const latestDist = etf.distributions && etf.distributions.length > 0 ? etf.distributions[0] : null;
    const rawQty = holdings[etf.symbol];
    const qty = typeof rawQty === 'number' ? rawQty : (Number(rawQty) || 0);
    
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
      quantity: rawQty !== undefined ? rawQty : 0,
      numericQuantity: qty,
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
              ₩{mounted ? Math.round(totalNetKrwWeeklyIncome).toLocaleString() : '...'}
            </div>
            <div className={styles.exchangeRate}>
              Net USD: ${mounted ? totalNetUsdWeeklyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'} &nbsp;|&nbsp; Rate: 1 USD = ₩{exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 1 })}
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
                    <td>
                      <input 
                        type="number" 
                        min="0"
                        className={styles.quantityInput}
                        value={item.quantity}
                        onChange={(e) => handleHoldingChange(item.symbol, e.target.value)}
                        placeholder="0"
                      />
                    </td>
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
