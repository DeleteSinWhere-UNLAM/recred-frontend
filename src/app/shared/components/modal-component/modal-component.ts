import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonComponent } from '../button-component/button-component';

@Component({
  selector: 'app-modal-component',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './modal-component.html',
  styleUrl: './modal-component.css',
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() message = '';
  @Input() confirmText = 'Aceptar';
  @Input() confirmVariant: 'primary' | 'success' | 'danger' | 'outline' = 'success';
  @Input() cancelText = 'Cancelar';
  @Input() showCancel = true;
  @Input() customClass = '';

  @Output() confirm = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();
}
