import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component';

@Component({
  selector: 'app-crop-modal',
  standalone: true,
  imports: [ImageCropperComponent, ButtonComponent],
  templateUrl: './crop-modal.component.html',
  styleUrl: './crop-modal.component.css',
})
export class CropModalComponent {
  @Input({ required: true }) imageEvent: Event | null = null;
  @Output() cropped = new EventEmitter<Blob>();
  @Output() canceled = new EventEmitter<void>();

  private croppedBlob: Blob | null = null;

  protected imageCropped(event: ImageCroppedEvent) {
    this.croppedBlob = event.blob ?? null;
  }

  protected confirm() {
    if (this.croppedBlob) {
      this.cropped.emit(this.croppedBlob);
    }
  }

  protected cancel() {
    this.canceled.emit();
  }
}
