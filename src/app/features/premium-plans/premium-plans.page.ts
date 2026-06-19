import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { PricingPlansComponent } from '../../shared/components/pricing-plans/pricing-plans.component';
import { UsuarioService } from '../../data-access/services/usuario.service';

@Component({
  selector: 'app-premium-plans-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, PricingPlansComponent],
  template: `
    <app-navbar />
    <main style="padding-top: 80px; min-height: 100vh; background-color: var(--color-fondo);">
      <app-pricing-plans [userType]="userType()"></app-pricing-plans>
    </main>
  `
})
export class PremiumPlansPage {
  private readonly usuarioService = inject(UsuarioService);
  
  userType = computed<'padre' | 'kiosquero'>(() => {
    return this.usuarioService.esVistaKiosquero() ? 'kiosquero' : 'padre';
  });
}
