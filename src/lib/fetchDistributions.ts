import * as cheerio from 'cheerio';
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

export async function fetchDistributions(url: string): Promise<Distribution[]> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const distributions: Distribution[] = [];
    
    let targetTable: cheerio.Cheerio<cheerio.Element> | null = null;
    $('table').each((i, table) => {
      const headerText = $(table).find('th, td').text();
      if (headerText.includes('Ex Date') && headerText.includes('Amount Paid')) {
        targetTable = $(table);
      }
    });

    if (!targetTable) {
      console.warn('Could not find distribution table for', url);
      // Alternative: search for div-based tables if normal tables are missing
      $('div').each((i, div) => {
        const headerText = $(div).text();
        if (headerText.includes('Distribution History') && headerText.includes('Ex Date') && headerText.includes('Amount Paid')) {
            targetTable = $(div);
        }
      });
      if (!targetTable) return [];
    }

    // Extract rows mapping
    targetTable.find('tr').each((i, row) => {
      // Find cells: either td or th
      const cells = $(row).find('td');
      if (cells.length >= 5) {
        const declarationDate = $(cells[0]).text().trim();
        const exDate = $(cells[1]).text().trim();
        const recordDate = $(cells[2]).text().trim();
        const payDate = $(cells[3]).text().trim();
        const amountPaid = $(cells[4]).text().trim();
        
        // Exclude the header row if accidentally caught
        if (amountPaid !== 'Amount Paid' && exDate !== 'Ex Date' && amountPaid.includes('$')) {
          distributions.push({
            declarationDate,
            exDate,
            recordDate,
            payDate,
            amountPaid
          });
        }
      } else if ($(row).find('div').length >= 5) {
        // fallback for div rows
        const cells = $(row).find('div');
        const declarationDate = $(cells[0]).text().trim();
        const exDate = $(cells[1]).text().trim();
        const recordDate = $(cells[2]).text().trim();
        const payDate = $(cells[3]).text().trim();
        const amountPaid = $(cells[4]).text().trim();
        
        if (amountPaid !== 'Amount Paid' && exDate !== 'Ex Date' && amountPaid.includes('$')) {
          distributions.push({
            declarationDate,
            exDate,
            recordDate,
            payDate,
            amountPaid
          });
        }
      }
    });

    return distributions;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getAllEtfData(): Promise<EtfData[]> {
  const results = await Promise.all(
    etfSources.map(async (source) => {
      const distributions = await fetchDistributions(source.url);
      return {
        ...source,
        distributions
      };
    })
  );
  return results;
}
