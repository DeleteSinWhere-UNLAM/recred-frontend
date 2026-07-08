import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ComboPromotionModalComponent } from '../sugerencias/components/combo-promotion-modal/combo-promotion-modal.component';
import { InteligenciaComercialPresenter } from './presenter/inteligencia-comercial.presenter';

@Component({
  selector: 'app-inteligencia-comercial-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ComboPromotionModalComponent],
  providers: [InteligenciaComercialPresenter],
  templateUrl: './inteligencia-comercial.page.html',
  styleUrl: './inteligencia-comercial.page.css',
})
export class InteligenciaComercialPage implements OnInit {
  readonly presenter = inject(InteligenciaComercialPresenter);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  constructor() {
    this.usuarioService.setHomeUrl('/kiosquero');
  }

  ngOnInit(): void {
    this.presenter.inicializar();
  }

  volver(): void {
    this.router.navigateByUrl('/kiosquero');
  }
}
