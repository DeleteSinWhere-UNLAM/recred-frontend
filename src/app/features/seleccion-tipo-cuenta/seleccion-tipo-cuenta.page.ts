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
        padding: 36px 32px;
        text-align: center;
        font-family: var(--font-body);
        background: var(--color-superficie);
        border: 1px solid var(--color-borde);
        border-radius: var(--radius-card);
        box-shadow: var(--shadow-card);
      }
      .placeholder h1 {
        font-family: var(--font-display);
        color: var(--color-pizarra);
        margin-bottom: 12px;
      }
      .placeholder p {
        color: var(--color-texto-oscuro);
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
