import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { PricingPlansComponent } from '../../shared/components/pricing-plans/pricing-plans.component';
import { UsuarioService } from '../../data-access/services/usuario.service';

@Component({
  selector: 'app-premium-plans-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, PricingPlansComponent, RouterLink],
  template: `
    <app-navbar />
    <main style="box-sizing: border-box; padding-top: 24px; min-height: calc(100vh - 70px); background-color: var(--color-fondo); display: flex; flex-direction: column;">
      <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px 0; width: 100%;">
        @if (userType() === 'kiosquero') {
          <button class="venta__volver" routerLink="/kiosquero">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Volver</span>
          </button>
        } @else {
          <button class="venta__volver" routerLink="/tutor">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Volver</span>
          </button>
        }
      </div>
      <app-pricing-plans style="flex: 1; display: flex; flex-direction: column; justify-content: flex-start; padding-top: 10px;" [userType]="userType()"></app-pricing-plans>
    </main>
  `,
  styles: [`
    .venta__volver {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-height: 44px;
      padding: 0 18px;
      background-color: rgba(255, 255, 255, 0.86);
      border: 1px solid var(--color-borde);
      color: var(--color-pizarra);
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 13px;
      border-radius: var(--radius-button);
      box-shadow: 0 10px 26px rgba(51, 65, 85, 0.08);
      transition: all var(--transition-ui);
      cursor: pointer;
    }
    .venta__volver:hover {
      background-color: var(--color-superficie);
      border-color: var(--color-borde-fuerte);
      color: var(--color-pizarra-dark);
    }
  `]
})
export class PremiumPlansPage {
  private readonly usuarioService = inject(UsuarioService);
  
  userType = computed<'padre' | 'kiosquero'>(() => {
    return this.usuarioService.esVistaKiosquero() ? 'kiosquero' : 'padre';
  });
}
