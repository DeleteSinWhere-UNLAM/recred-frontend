import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-seleccion-tipo-cuenta-page',
  template: `
    <main class="placeholder">
      <h1>Bienvenido a RECRED</h1>
      <p>Para terminar de crear tu cuenta, elegí qué tipo de usuario sos.</p>
      <p class="placeholder__nota">
        (Pantalla en construcción — esperando endpoint del back)
      </p>
    </main>
  `,
  styles: [
    `
      .placeholder {
        max-width: 480px;
        margin: 80px auto;
        padding: 32px;
        text-align: center;
        font-family: var(--font-body);
      }
      .placeholder__nota {
        margin-top: 32px;
        color: var(--color-texto-claro);
        font-size: 14px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeleccionTipoCuentaPage {}
