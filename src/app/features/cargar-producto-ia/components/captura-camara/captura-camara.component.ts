import { Component, Output, EventEmitter, Input } from '@angular/core';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

@Component({
  selector: 'app-captura-camara',
  standalone: true,
  imports: [],
  templateUrl: './captura-camara.component.html',
  styleUrl: './captura-camara.component.css',
})
export class CapturaCamaraComponent {
  @Output() photoTaken = new EventEmitter<File>();
  @Input() isScanning = false;

  errorMessage: string | null = null;

  onFileSelected(event: Event) {
    this.errorMessage = null;
    const target = event.target as HTMLInputElement;
    const image = target.files?.[0];

    if (!image) return;

    if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
      this.errorMessage = 'Solo se permiten archivos de imagen (JPEG, PNG, WebP, GIF, BMP).';
      target.value = '';
      return;
    }

    if (image.size > MAX_FILE_SIZE_BYTES) {
      this.errorMessage = `La imagen no debe superar los ${MAX_FILE_SIZE_MB}MB.`;
      target.value = '';
      return;
    }

    this.photoTaken.emit(image);
  }
}
