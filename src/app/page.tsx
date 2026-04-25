import { getAllEtfData } from '@/lib/fetchDistributions';
import { getUsdToKrwRate } from '@/lib/fetchExchangeRate';
import HomeClient from './HomeClient';

// Revalidate page data every hour
export const revalidate = 3600;

export default async function Home() {
  const etfData = await getAllEtfData();
  const exchangeRate = await getUsdToKrwRate();
  
  return <HomeClient etfData={etfData} exchangeRate={exchangeRate} />;
}
