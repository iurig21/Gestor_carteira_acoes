import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Stock, ApiQuote } from '../models/stock.interface';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiKey = '38c36f59f1a8013e97a17a901cfefd0b'; // Replace with your API key
  private baseUrl = 'http://api.marketstack.com/v1';

  constructor(private http: HttpClient) {}

  // Get stock quotes from API
  getStockQuotes(symbols: string[]): Observable<ApiQuote[]> {
    const requests = symbols.map(symbol => 
      this.http.get<any>(`${this.baseUrl}/eod/latest`, {
        params: {
          access_key: this.apiKey,
          symbols: symbol
        }
      }).pipe(
        map(response => ({
          symbol: symbol,
          price: response.data[0]?.close || 0,
          // The change_pct here is just per-share, not total investment
          change_pct: this.calculateVariation(response.data[0]?.close, response.data[0]?.open || 0)
        })),
        catchError(() => of({
          symbol: symbol,
          price: Math.random() * 400 + 200, // Mock data for demo
          change_pct: (Math.random() - 0.5) * 10
        }))
      )
    );

    return forkJoin(requests);
  }

  // Load portfolio from JSON file
  loadPortfolioFromJson(): Observable<Stock[]> {
    // For demo purposes, returning mock data
    // In real implementation, you would load from a JSON file
    return this.http.get<Stock[]>('assets/db.json').pipe(
      map(stocks => stocks.map(stock => ({
      ...stock,
      variation: this.calculateTotalVariation(stock.currentPrice ?? 0, stock.purchasePrice ?? 0, stock.quantity ?? 0)
      }))),
      catchError(error => {
      console.error('Error loading portfolio data:', error);
      return of([]);
      })
    );
  }

  /**
   * Calculates the variation based on total investment:
   * ((currentPrice * quantity) - (purchasePrice * quantity)) / (purchasePrice * quantity) * 100
   */
  private calculateTotalVariation(currentPrice: number, purchasePrice: number, quantity: number): number {
    const totalPurchase = purchasePrice * quantity;
    const currentValue = currentPrice * quantity;
    if (!totalPurchase) return 0;
    return ((currentValue - totalPurchase) / totalPurchase) * 100;
  }

  /**
   * Per-share variation (not used for total investment variation in the table)
   */
  private calculateVariation(current: number, previous: number): number {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  }
}