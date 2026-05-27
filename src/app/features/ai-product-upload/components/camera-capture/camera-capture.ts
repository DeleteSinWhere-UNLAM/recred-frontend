import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-camera-capture',
  standalone: true,
  imports: [],
  templateUrl: './camera-capture.html',
  styleUrl: './camera-capture.css',
})
export class CameraCapture {
  @Output() photoTaken = new EventEmitter<File>();

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.photoTaken.emit(file);
    }
  }
}
