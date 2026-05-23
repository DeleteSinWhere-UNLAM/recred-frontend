import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button-component',
  standalone: true,
  imports: [],
  templateUrl: './button-component.html',
  styleUrl: './button-component.css',
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'success' | 'danger' | 'outline' = 'primary';
  @Input() disabled = false;
  @Output() onClick = new EventEmitter<void>();

  getClasses(): string {
    const base = 'px-4 py-2 rounded-lg font-semibold transition-all duration-200 ';

    if (this.disabled) return base + 'bg-texto-claro text-white opacity-50 cursor-not-allowed';

    switch (this.variant) {
      case 'primary': return base + 'bg-pizarra text-white hover:opacity-90 shadow-md';
      case 'success': return base + 'bg-menta text-white hover:opacity-90 shadow-md';
      case 'danger': return base + 'bg-melocoton text-white hover:opacity-90 shadow-md';
      case 'outline': return base + 'border-2 border-pizarra text-pizarra hover:bg-pizarra hover:text-white';
      default: return base;
    }
  }
}
