import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal-confirmar-eliminar',
  standalone: true,
  templateUrl: './modal-confirmar-eliminar.component.html',
  styleUrl: './modal-confirmar-eliminar.component.css'
})
export class ModalConfirmarEliminarComponent {
  @Input() isOpen = false;
  @Input() productName = '';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
