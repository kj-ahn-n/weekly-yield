import etfSources from '../data/etf-sources.json';

export interface Distribution {
  declarationDate: string;
  exDate: string;
  recordDate: string;
  payDate: string;
  amountPaid: string;
}

export interface EtfSource {
  symbol: string;
  name: string;
  url: string;
  tokenUrl: string;
  dataUrl: string;
}

export interface EtfData extends EtfSource {
  distributions: Distribution[];
}

export async function fetchDistributions(source: EtfSource): Promise<Distribution[]> {
  try {
    // 1. Get auth token and session cookie from the remote server
    const tokenRes = await fetch(source.tokenUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": source.url
      },
      next: { revalidate: 3600 }
    });
    
    if (!tokenRes.ok) throw new Error("Failed to get token for " + source.symbol);
    
    const token = await tokenRes.text();
    const originalCookies = tokenRes.headers.get("set-cookie") || tokenRes.headers.get("Set-Cookie");
    
    // Parse cookie (ignore Path, Expires, etc. for the simple request payload)
    let cookieStr = "";
    if (originalCookies) {
        const match = originalCookies.match(/PHPSESSID=[^;]+/);
        if (match) cookieStr = match[0];
    }

    // 2. Fetch the true distribution JSON from the internal API
    const params = new URLSearchParams();
    params.append('upperetf', source.symbol.toUpperCase());
    params.append('loweretf', source.symbol.toLowerCase());
    params.append('token', token.trim());
    params.append('is_ajax', '1');

    // Extract base origin for headers dynamically from the source string
    const originUrl = new URL(source.dataUrl).origin;

    const res = await fetch(source.dataUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": cookieStr,
        "Referer": source.url,
        "User-Agent": "Mozilla/5.0",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": originUrl,
        "Accept": "*/*"
      },
      body: params,
      next: { revalidate: 3600 }
    });

    if (!res.ok) throw new Error("Failed to get distributions for " + source.symbol);

    const txt = await res.text();
    if (!txt.trim()) return [];
    
    const rawArray: string[][] = JSON.parse(txt);
    
    // Reverse array to put the most recent distributions at the top
    const reversed = rawArray.slice().reverse();

    const distributions: Distribution[] = reversed
      .filter(row => row[4] && row[4].trim() !== "")
      .map(row => {
        return {
          declarationDate: row[0] || "",
          exDate: row[1] || "",
          recordDate: row[2] || "",
          payDate: row[3] || "",
          amountPaid: row[4] && !row[4].startsWith('$') ? "$" + row[4] : (row[4] || "")
        };
      });

    return distributions;
  } catch (error) {
    console.error(`Error fetching distributions for ${source.symbol}:`, error);
    return [];
  }
}

export async function getAllEtfData(): Promise<EtfData[]> {
  const results = await Promise.all(
    etfSources.map(async (src) => {
      const source = src as EtfSource;
      const distributions = await fetchDistributions(source);
      return {
        ...source,
        distributions
      };
    })
  );
  return results;
}
