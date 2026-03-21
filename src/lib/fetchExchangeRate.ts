export async function getUsdToKrwRate(): Promise<number> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (!res.ok) return 1400; // Fallback
    const data = await res.json();
    return data.rates.KRW || 1400;
  } catch (error) {
    console.error("Failed to fetch exchange rate:", error);
    return 1400; // Fallback
  }
}
