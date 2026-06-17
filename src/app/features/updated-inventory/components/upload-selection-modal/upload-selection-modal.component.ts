import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-upload-selection-modal',
  standalone: true,
  templateUrl: './upload-selection-modal.component.html',
  styleUrl: './upload-selection-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadSelectionModalComponent {
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
