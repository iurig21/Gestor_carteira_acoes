import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { Stock, Portfolio } from '../../models/stock.interface';
import { StockService } from '../../services/stock.service';
import { PortfolioService } from '../../services/portfolio.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {
  portfolio$ = new BehaviorSubject<Portfolio>({
    stocks: [],
    totalPurchaseValue: 0,
    totalCurrentValue: 0,
    totalVariation: 0
  });

  // Form fields
  newTicker = '';
  newQuantity = 0;
  newPrice = 0;

  // UI state
  loading = false;
  error: string | null = null;

  constructor(
    private stockService: StockService,
    private portfolioService: PortfolioService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadPortfolio();
  }

  loadPortfolio(): void {
    this.loading = true;
    this.error = null;
    this.portfolioService.getPortfolio().subscribe({
      next: portfolio => {
        this.portfolio$.next(portfolio);
        this.loading = false;
      },
      error: err => {
        this.error = 'Failed to load portfolio data';
        this.loading = false;
      }
    });
  }

  addStock(): void {
    if (!this.newTicker || this.newQuantity <= 0 || this.newPrice <= 0) return;

    // Create stock with static info; currentPrice & variation will be updated on next load.
    let newStock: Stock = {
      ticker: this.newTicker,
      company: this.newTicker, // placeholder; could be updated via an API call if needed
      purchaseDate: new Date().toISOString(),
      quantity: this.newQuantity,
      purchasePrice: this.newPrice,
      // Do not set currentPrice or variation here – let them update from the API when loading portfolio.
    };

    this.portfolioService.addStockToPortfolio(newStock).subscribe(() => {
      this.loadPortfolio();
    });

    // Reset form fields
    this.newTicker = '';
    this.newQuantity = 0;
    this.newPrice = 0;
  }

  // For file upload (optional, if you want to support JSON import)
  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          const imported = json.portfolio || json.stocks;
          if (Array.isArray(imported)) {
            // POST each imported stock to json-server
            forkJoin(imported.map(stock =>
              this.http.post('http://localhost:3000/portfolio', stock)
            )).subscribe({
              next: () => this.loadPortfolio(),
              error: () => this.error = 'Failed to import stocks'
            });
          } else {
            this.error = 'Invalid JSON format';
          }
        } catch (error) {
          this.error = 'Error parsing JSON file';
        }
      };
      reader.readAsText(file);
    }
  }

  // Helpers for formatting and styling
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  }

  formatPercentage(value: number): string {
    return `${value > 0 ? '+' : ''}${(value || 0).toFixed(2)}%`;
  }

  getVariationClass(variation: number): string {
    if (variation > 0) return 'text-success';
    if (variation < 0) return 'text-danger';
    return 'text-dark';
  }
}