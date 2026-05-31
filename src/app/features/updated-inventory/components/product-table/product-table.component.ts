import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../models/product.interface';

@Component({
  selector: 'app-product-table',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './product-table.component.html',
  styleUrl: './product-table.component.css'
})
export class ProductTableComponent {
  @Input() products: Product[] = [];
  @Input() isLoading = false;
  @Output() edit = new EventEmitter<Product>();
  @Output() remove = new EventEmitter<Product>();
}
