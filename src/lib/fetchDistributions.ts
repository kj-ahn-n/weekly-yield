import etfSources from '../data/etf-sources.json';

export interface Distribution {
  declarationDate: string;
  exDate: string;
  recordDate: string;
  payDate: string;
  amountPaid: string;
}

export interface EtfData {
  symbol: string;
  name: string;
  url: string;
  distributions: Distribution[];
}

export async function fetchDistributions(symbol: string): Promise<Distribution[]> {
  try {
    // 1. Get auth token and session cookie from the remote server
    const tokenUrl = "https://www.roundhillinvestments.com/assets/php/server.php";
    const tokenRes = await fetch(tokenUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": `https://www.roundhillinvestments.com/etf/${symbol.toLowerCase()}/`
      },
      next: { revalidate: 3600 }
    });
    
    if (!tokenRes.ok) throw new Error("Failed to get token for " + symbol);
    
    const token = await tokenRes.text();
    const originalCookies = tokenRes.headers.get("set-cookie") || tokenRes.headers.get("Set-Cookie");
    
    // Parse cookie (ignore Path, Expires, etc. for the simple request payload)
    let cookieStr = "";
    if (originalCookies) {
        const match = originalCookies.match(/PHPSESSID=[^;]+/);
        if (match) cookieStr = match[0];
    }

    // 2. Fetch the true distribution JSON from the internal API
    const dataUrl = "https://www.roundhillinvestments.com/assets/php/distribution-call.php";
    const params = new URLSearchParams();
    params.append('upperetf', symbol.toUpperCase());
    params.append('loweretf', symbol.toLowerCase());
    params.append('token', token.trim());
    params.append('is_ajax', '1');

    const res = await fetch(dataUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": cookieStr,
        "Referer": `https://www.roundhillinvestments.com/etf/${symbol.toLowerCase()}/`,
        "User-Agent": "Mozilla/5.0",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": "https://www.roundhillinvestments.com",
        "Accept": "*/*"
      },
      body: params,
      next: { revalidate: 3600 }
    });

    if (!res.ok) throw new Error("Failed to get distributions for " + symbol);

    const txt = await res.text();
    if (!txt.trim()) return [];
    
    const rawArray: string[][] = JSON.parse(txt);
    
    // Reverse array to put the most recent distributions at the top
    const reversed = rawArray.slice().reverse();

    const distributions: Distribution[] = reversed.map(row => {
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
    console.error(`Error fetching distributions for ${symbol}:`, error);
    return [];
  }
}

export async function getAllEtfData(): Promise<EtfData[]> {
  const results = await Promise.all(
    etfSources.map(async (source) => {
      const distributions = await fetchDistributions(source.symbol);
      return {
        ...source,
        distributions
      };
    })
  );
  return results;
}
