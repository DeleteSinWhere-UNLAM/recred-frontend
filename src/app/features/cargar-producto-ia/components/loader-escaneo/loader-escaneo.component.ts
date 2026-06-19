import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loader-escaneo',
  standalone: true,
  imports: [],
  templateUrl: './loader-escaneo.component.html',
  styleUrl: './loader-escaneo.component.css',
})
export class LoaderEscaneoComponent {
  @Input() isScanning = false;
}
