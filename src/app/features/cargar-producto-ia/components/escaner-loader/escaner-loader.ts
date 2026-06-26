import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-scanner-loader',
  standalone: true,
  imports: [],
  templateUrl: './escaner-loader.html',
  styleUrl: './escaner-loader.css',
})
export class EscanerLoader {
  @Input() isScanning = false;
}
