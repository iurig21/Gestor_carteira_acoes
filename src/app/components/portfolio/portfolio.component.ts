import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { PortfolioService } from '../../services/portfolio.service';
import { StockService } from '../../services/stock.service';
import { Portfolio, Stock } from '../../models/stock.interface';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {
  // Initialize portfolio$ as a BehaviorSubject to allow mutable updates
  portfolio$ = new BehaviorSubject<Portfolio>({
    stocks: [],
    totalPurchaseValue: 0,
    totalCurrentValue: 0,
    totalVariation: 0
  });
  loading = true;
  error: string | null = null;

  // New properties for manual stock entry
  newTicker = '';
  newQuantity = 0;
  newPrice = 0;

  constructor(
    private portfolioService: PortfolioService,
    private stockService: StockService // new injection
  ) {}

  ngOnInit(): void {
    this.loadPortfolio();
  }

  loadPortfolio(): void {
    this.loading = true;
    this.error = null;
    
    this.portfolioService.getPortfolio().subscribe({
      next: data => {
        this.portfolio$.next(data);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load portfolio data';
        console.error('Portfolio loading error:', err);
      }
    });
  }

  // New method to handle JSON file upload for portfolio data
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        if (jsonData.stocks) {
          const current = this.portfolio$.value;
          const updatedStocks = current.stocks.concat(jsonData.stocks);
          // Optionally recalc totals here if needed
          this.portfolio$.next({ ...current, stocks: updatedStocks });
        }
      } catch (err) {
        console.error('Invalid JSON file', err);
      }
    };
    reader.readAsText(file);
  }

  // Modified addStock method using StockService to retrieve current price and variation
  addStock(): void {
    if (!this.newTicker || this.newQuantity <= 0 || this.newPrice <= 0) return;
    
    // Create a new stock with initial values
    let newStock: Stock = {
      ticker: this.newTicker,
      company: this.newTicker, // Placeholder, update if needed
      purchaseDate: new Date().toISOString(),
      quantity: this.newQuantity,
      purchasePrice: this.newPrice,
      currentPrice: this.newPrice, // default, will be updated
      variation: 0
    };

    // Call marketstack API for current data
    this.stockService.getStockQuotes([this.newTicker]).subscribe(apiQuotes => {
      if (apiQuotes && apiQuotes.length) {
        const quote = apiQuotes[0];
        newStock.currentPrice = quote.price;
        const totalPurchase = newStock.purchasePrice * newStock.quantity;
        const currentValue = newStock.currentPrice * newStock.quantity;
        newStock.variation = ((currentValue - totalPurchase) / totalPurchase) * 100;
      }
      // Merge the new stock into the current portfolio
      const current = this.portfolio$.value;
      const updatedStocks = current.stocks.concat(newStock);
      this.portfolio$.next({ ...current, stocks: updatedStocks });
    });

    // Reset form fields
    this.newTicker = '';
    this.newQuantity = 0;
    this.newPrice = 0;
  }

  getVariationClass(variation: number): string {
    if (variation > 0) return 'text-success';
    if (variation < 0) return 'text-danger';
    return 'text-dark';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  }
}