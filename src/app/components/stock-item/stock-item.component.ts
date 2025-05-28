import { Component, Input } from '@angular/core';
import { Stock } from '../../models/stock.interface';

@Component({
  selector: 'app-stock-item',
  templateUrl: './stock-item.component.html',
  styleUrls: ['./stock-item.component.css']
})
export class StockItemComponent {
  @Input() stock!: Stock;
}
