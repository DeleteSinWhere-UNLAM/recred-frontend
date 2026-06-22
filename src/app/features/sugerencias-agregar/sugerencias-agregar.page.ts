import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { } from '../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { SugerenciasAgregarPresenter } from './presenter/sugerencias-agregar.presenter';

@Component({
  selector: 'app-sugerencias-agregar-page',
  standalone: true,
  templateUrl: './sugerencias-agregar.page.html',
  styleUrl: './sugerencias-agregar.page.css',
  imports: [CommonModule],
  providers: [SugerenciasAgregarPresenter],
})
export class SugerenciasAgregarPage implements OnInit {
  readonly presenter = inject(SugerenciasAgregarPresenter);
  private readonly router = inject(Router);
  private readonly usuarioService = inject(UsuarioService);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  constructor() {
    this.usuarioService.setHomeUrl('/kiosquero');
  }

  ngOnInit(): void {
    const perfilRaw = localStorage.getItem('recred.perfil');
    const usuarioId = perfilRaw ? JSON.parse(perfilRaw).id : null;
    if (usuarioId) {
      this.presenter.initialize(usuarioId);
    }
  }

  volver(): void {
    this.router.navigateByUrl('/kiosquero');
  }
}
