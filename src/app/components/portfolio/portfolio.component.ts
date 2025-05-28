import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { PortfolioService } from '../../services/portfolio.service';
import { Portfolio, Stock } from '../../models/stock.interface';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {
  portfolio$: Observable<Portfolio> | null = null;
  loading = true;
  error: string | null = null;

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit(): void {
    this.loadPortfolio();
  }

  loadPortfolio(): void {
    this.loading = true;
    this.error = null;
    
    this.portfolio$ = this.portfolioService.getPortfolio();
    
    if (this.portfolio$) {
      this.portfolio$.subscribe({
        next: () => this.loading = false,
        error: (err) => {
          this.loading = false;
          this.error = 'Failed to load portfolio data';
          console.error('Portfolio loading error:', err);
        }
      });
    }
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