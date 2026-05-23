import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalComponent } from './shared/components/modal-component/modal-component';
import { PwaUpdateService } from './core/pwa/services/pwaUpdateService/pwa-update-service';
import { ButtonComponent } from './shared/components/button-component/button-component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ModalComponent, ButtonComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('recreopago');
  readonly pwaService = inject(PwaUpdateService);

  // borrar antes de subir
  forzarAperturaModal() {
    this.pwaService.updateAvailable.set(true);
  }

  cerrarModal() {
    this.pwaService.updateAvailable.set(false);
  }
}
