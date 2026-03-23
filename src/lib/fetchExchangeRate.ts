import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function getUsdToKrwRate(): Promise<number> {
  try {
    const quote = await yahooFinance.quote('USDKRW=X');
    return quote.regularMarketPrice || 1400;
  } catch (error) {
    console.error("Failed to fetch exchange rate:", error);
    return 1400; // Fallback
  }
}
