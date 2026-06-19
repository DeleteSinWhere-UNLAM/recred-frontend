import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-modal-seleccion-carga',
  standalone: true,
  templateUrl: './modal-seleccion-carga.component.html',
  styleUrl: './modal-seleccion-carga.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalSeleccionCargaComponent {
  @Output() individualUpload = new EventEmitter<void>();
  @Output() bulkUpload = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  onIndividualUpload(): void {
    this.individualUpload.emit();
  }

  onBulkUpload(): void {
    this.bulkUpload.emit();
  }

  onCancel(): void {
    this.closeModal.emit();
  }
}
