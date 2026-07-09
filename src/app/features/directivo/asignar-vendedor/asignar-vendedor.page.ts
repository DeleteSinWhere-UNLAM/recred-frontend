import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { Router } from '@angular/router';
import { AsignarVendedorPresenter } from './presenter/asignar-vendedor.presenter';
import { AsignarVendedorFormComponent } from './components/asignar-vendedor-form/asignar-vendedor-form.component';
import { CrearVendedorRequest } from '../models/directivo.model';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-asignar-vendedor-page',
  standalone: true,
  imports: [AsignarVendedorFormComponent, NavbarComponent],
  templateUrl: './asignar-vendedor.page.html',
  styleUrl: './asignar-vendedor.page.css',
  providers: [AsignarVendedorPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AsignarVendedorPage implements OnInit {
  protected readonly presenter = inject(AsignarVendedorPresenter);
  private readonly router = inject(Router);
  
  buffetId: string | null = null;
  buffetName = '';
  mode: 'create' | 'replace' = 'create';
  
  mostrarModalConfirmacion = signal(false);
  datosPendientes = signal<CrearVendedorRequest | null>(null);

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state && nav.extras.state['buffetId']) {
      this.buffetId = nav.extras.state['buffetId'];
      this.buffetName = nav.extras.state['buffetName'] || '';
      this.mode = nav.extras.state['mode'] || 'create';
    } else {
      const state = history.state;
      if (state && state['buffetId']) {
        this.buffetId = state['buffetId'];
        this.buffetName = state['buffetName'] || '';
        this.mode = state['mode'] || 'create';
      } else {
        console.warn('No buffetId provided, returning to dashboard');
        this.router.navigate(['/directivo']);
      }
    }
  }

  onSubmit(data: CrearVendedorRequest) {
    if (this.buffetId) {
      if (this.mode === 'replace') {
        this.datosPendientes.set(data);
        this.mostrarModalConfirmacion.set(true);
      } else {
        this.presenter.asignar(this.buffetId, data);
      }
    }
  }

  cerrarModalConfirmacion() {
    this.mostrarModalConfirmacion.set(false);
    this.datosPendientes.set(null);
  }

  confirmarReemplazo() {
    const data = this.datosPendientes();
    if (this.buffetId && data) {
      this.presenter.reemplazar(this.buffetId, data);
    }
    this.cerrarModalConfirmacion();
  }
}
