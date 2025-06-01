export interface Stock {
  id: string;
  ticker: string;
  company: string;
  purchaseDate: string;
  quantity: number;
  purchasePrice: number;
  currentPrice?: number;
  variation?: number;
}

export interface Portfolio {
  stocks: Stock[];
  totalPurchaseValue: number;
  totalCurrentValue: number;
  totalVariation: number;
}

export interface ApiQuote {
  symbol: string;
  price: number;
  change_pct: number;
}

export interface MarketStackResponse {
  data: MarketStackData[];
}

export interface MarketStackData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: string;
  symbol: string;
}