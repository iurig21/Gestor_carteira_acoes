import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioComponent } from './components/portfolio/portfolio.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PortfolioComponent],
  template: `
    <div class="app-container">
      <app-portfolio></app-portfolio>
    </div>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Stock Portfolio Monitor';
}