import YahooFinance from 'yahoo-finance2';
import etfSources from '../data/etf-sources.json';
import {
  parseYahooDividends,
  parseRoundhillDistributions,
  type Distribution,
  type RoundhillRow,
} from './distributionParsers';

export type { Distribution } from './distributionParsers';

export interface EtfSource {
  symbol: string;
  name: string;
  url: string;
  tokenUrl: string;
  dataUrl: string;
}

export type DistributionProvider = 'yahoo' | 'roundhill' | null;

export interface EtfData extends EtfSource {
  distributions: Distribution[];
  dataProvider: DistributionProvider;
}

const yahooFinance = new YahooFinance();
const DAY_MS = 24 * 60 * 60 * 1000;
const ROUNDHILL_TIMEOUT_MS = 8000;

async function fetchYahooDistributions(symbol: string): Promise<Distribution[]> {
  const chart = await yahooFinance.chart(symbol, {
    period1: new Date(Date.now() - 365 * DAY_MS),
    interval: '1d',
    events: 'div',
  });

  return parseYahooDividends(chart.events?.dividends ?? []);
}

async function fetchRoundhillDistributions(source: EtfSource): Promise<Distribution[]> {
  // Tokens are session-bound; do not cache them independently of the session cookie.
  const tokenRes = await fetch(source.tokenUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Referer: source.url,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(ROUNDHILL_TIMEOUT_MS),
  });

  if (!tokenRes.ok) {
    throw new Error(`Roundhill token request failed: HTTP ${tokenRes.status}`);
  }

  const token = (await tokenRes.text()).trim();
  if (!token) throw new Error('Roundhill returned an empty token');

  const cookie = tokenRes.headers.get('set-cookie')?.match(/PHPSESSID=[^;]+/)?.[0] ?? '';
  const params = new URLSearchParams({
    upperetf: source.symbol.toUpperCase(),
    loweretf: source.symbol.toLowerCase() + '/',
    token,
    is_ajax: '1',
  });

  const res = await fetch(source.dataUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Cookie: cookie,
      Referer: source.url,
      'User-Agent': 'Mozilla/5.0',
      'X-Requested-With': 'XMLHttpRequest',
      Origin: new URL(source.dataUrl).origin,
      Accept: '*/*',
    },
    body: params,
    cache: 'no-store',
    signal: AbortSignal.timeout(ROUNDHILL_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Roundhill distribution request failed: HTTP ${res.status}`);
  }

  const json: unknown = await res.json();
  if (!Array.isArray(json)) {
    throw new Error('Roundhill returned a non-array distribution response');
  }

  const distributions = parseRoundhillDistributions(json as RoundhillRow[]);
  if (distributions.length === 0) {
    throw new Error('Roundhill returned no valid distributions');
  }
  return distributions;
}

async function fetchWithProvider(source: EtfSource): Promise<Pick<EtfData, 'distributions' | 'dataProvider'>> {
  let yahooError = 'No dividend events returned';

  try {
    const distributions = await fetchYahooDistributions(source.symbol);
    if (distributions.length > 0) {
      return { distributions, dataProvider: 'yahoo' };
    }
  } catch (error) {
    yahooError = error instanceof Error ? error.message : String(error);
    console.warn(`Yahoo Finance distribution lookup failed for ${source.symbol}: ${yahooError}`);
  }

  try {
    const distributions = await fetchRoundhillDistributions(source);
    return { distributions, dataProvider: 'roundhill' };
  } catch (error) {
    const roundhillError = error instanceof Error ? error.message : String(error);
    console.error(
      `Distribution lookup failed for ${source.symbol}. Yahoo Finance: ${yahooError}; Roundhill: ${roundhillError}`
    );
    return { distributions: [], dataProvider: null };
  }
}

// Retain the existing exported API for callers that only need distribution rows.
export async function fetchDistributions(source: EtfSource): Promise<Distribution[]> {
  const result = await fetchWithProvider(source);
  return result.distributions;
}

export async function getAllEtfData(): Promise<EtfData[]> {
  return Promise.all(
    etfSources.map(async (src) => ({
      ...src,
      ...(await fetchWithProvider(src)),
    }))
  );
}
