import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { StockService } from './stock.service';
import { Stock, Portfolio, ApiQuote } from '../models/stock.interface';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  constructor(private stockService: StockService) {}

  getPortfolio(): Observable<Portfolio> {
    return combineLatest([
      this.stockService.loadPortfolioFromJson(),
      this.stockService.loadPortfolioFromJson().pipe(
        map((stocks: Stock[]) => stocks.map(s => s.ticker)),
        switchMap((symbols: string[]) => this.stockService.getStockQuotes(symbols))
      )
    ]).pipe(
      map(([stocks, quotes]: [Stock[], ApiQuote[]]) => {
        const updatedStocks = stocks.map(stock => {
          const quote = quotes.find((q: ApiQuote) => q.symbol === stock.ticker);
          return {
            ...stock,
            currentPrice: quote?.price || stock.purchasePrice,
            variation: quote?.change_pct || 0
          };
        });

        const totalPurchaseValue = updatedStocks.reduce(
          (sum, stock) => sum + (stock.quantity * stock.purchasePrice), 0
        );

        const totalCurrentValue = updatedStocks.reduce(
          (sum, stock) => sum + (stock.quantity * (stock.currentPrice || 0)), 0
        );

        const totalVariation = ((totalCurrentValue - totalPurchaseValue) / totalPurchaseValue) * 100;

        return {
          stocks: updatedStocks,
          totalPurchaseValue,
          totalCurrentValue,
          totalVariation
        };
      })
    );
  }
}