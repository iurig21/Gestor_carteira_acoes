import { Component, Input } from '@angular/core';
import { Stock } from '../../models/stock.interface';

@Component({
  selector: 'app-portfolio-summary',
  templateUrl: './portfolio-summary.component.html',
  styleUrls: ['./portfolio-summary.component.css']
})
export class PortfolioSummaryComponent {
  @Input() stocks: Stock[] = [];

  get totalValue(): number {
    return this.stocks.reduce((sum, s) => sum + s.price * s.quantity, 0);
  }

  get totalStocks(): number {
    return this.stocks.length;
  }
}
