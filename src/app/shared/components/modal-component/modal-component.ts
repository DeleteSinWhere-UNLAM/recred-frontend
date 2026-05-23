import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonComponent } from '../button-component/button-component';

@Component({
  selector: 'modal-component',
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
  @Input() cancelText = 'Cancelar';
  @Input() showCancel = true;

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
}
