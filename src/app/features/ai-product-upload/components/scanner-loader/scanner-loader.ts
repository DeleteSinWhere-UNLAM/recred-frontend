import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-scanner-loader',
  standalone: true,
  imports: [],
  templateUrl: './scanner-loader.html',
  styleUrl: './scanner-loader.css',
})
export class ScannerLoader {
  @Input() isScanning = false;
}
