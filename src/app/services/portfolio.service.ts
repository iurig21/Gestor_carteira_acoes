import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { Stock, Portfolio, ApiQuote } from '../models/stock.interface';
import { StockService } from './stock.service';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private url = 'http://localhost:3000/portfolio';

  constructor(private http: HttpClient, private stockService: StockService) {}

  // Get portfolio from json-server; then update stocks with fresh API data.
  getPortfolio(): Observable<Portfolio> {
    return this.http.get<Stock[]>(this.url).pipe(
      switchMap(staticStocks => {
        // Extract tickers from static data
        const tickers = staticStocks.map(s => s.ticker);
        // Get updated quotes for these tickers via StockService
        return this.stockService.getStockQuotes(tickers).pipe(
          map((apiQuotes: ApiQuote[]) => {
            // For each static stock, update currentPrice & recalc variation if API data is available.
            const updatedStocks = staticStocks.map(stock => {
              const quote = apiQuotes.find(q => q.symbol.toUpperCase() === stock.ticker.toUpperCase());
              if (quote) {
                const updatedCurrentPrice = typeof quote.price === 'string' ? parseFloat(quote.price) : quote.price;
                const totalPurchase = stock.purchasePrice * stock.quantity;
                const currentValue = updatedCurrentPrice * stock.quantity;
                return {
                  ...stock,
                  currentPrice: updatedCurrentPrice,
                  variation: totalPurchase ? ((currentValue - totalPurchase) / totalPurchase) * 100 : 0
                };
              }
              return {
                ...stock,
                currentPrice: stock.purchasePrice,
                variation: 0
              };
            });
            // Recalculate totals
            const totalPurchaseValue = updatedStocks.reduce((sum, s) => sum + (s.purchasePrice * s.quantity), 0);
            const totalCurrentValue = updatedStocks.reduce((sum, s) => sum + ((s.currentPrice || s.purchasePrice) * s.quantity), 0);
            const totalVariation = totalPurchaseValue === 0 ? 0 : ((totalCurrentValue - totalPurchaseValue) / totalPurchaseValue) * 100;
            return {
              stocks: updatedStocks,
              totalPurchaseValue,
              totalCurrentValue,
              totalVariation
            };
          }),
          catchError(err => {
            console.error('Error updating API quotes', err);
            // In error case return static data with defaults.
            const totalPurchaseValue = staticStocks.reduce((sum, s) => sum + (s.purchasePrice * s.quantity), 0);
            const totalCurrentValue = totalPurchaseValue;
            return of({
              stocks: staticStocks.map(s => ({ ...s, currentPrice: s.purchasePrice, variation: 0 })),
              totalPurchaseValue,
              totalCurrentValue,
              totalVariation: 0
            });
          })
        );
      })
    );
  }

  // Add new stock to json-server (store static info only)
  addStockToPortfolio(stock: Stock): Observable<Stock> {
    return this.http.post<Stock>(this.url, stock);
  }
}