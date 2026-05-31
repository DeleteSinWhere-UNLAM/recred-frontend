import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-delete-modal',
  standalone: true,
  templateUrl: './confirm-delete-modal.component.html',
  styleUrl: './confirm-delete-modal.component.css'
})
export class ConfirmDeleteModalComponent {
  @Input() isOpen = false;
  @Input() productName = '';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
