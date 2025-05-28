import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Stock, ApiQuote } from '../models/stock.interface';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiKey = '1c360ae8ecc400d2bcd4980f309d444a'; // Replace with your API key
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
          change_pct: this.calculateVariation(response.data[0]?.close, response.data[0]?.open)
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
    return of([
      {
        ticker: 'MSFT',
        company: 'Microsoft',
        purchaseDate: '2025-03-01',
        quantity: 20,
        purchasePrice: 320.00
      },
      {
        ticker: 'TSLA',
        company: 'Tesla',
        purchaseDate: '2025-03-20',
        quantity: 50,
        purchasePrice: 220.00
      }
    ]);
  }

  private calculateVariation(current: number, previous: number): number {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  }
}