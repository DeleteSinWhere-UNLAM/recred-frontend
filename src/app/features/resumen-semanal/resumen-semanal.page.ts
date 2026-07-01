import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ResumenSemanalPresenter } from './presenter/resumen-semanal.presenter';

@Component({
  selector: 'app-resumen-semanal-page',
  standalone: true,
  templateUrl: './resumen-semanal.page.html',
  styleUrl: './resumen-semanal.page.css',
  imports: [CommonModule, NavbarComponent],
  providers: [ResumenSemanalPresenter]
})
export class ResumenSemanalPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  readonly presenter = inject(ResumenSemanalPresenter);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual()?.nombre || '';

  ngOnInit(): void {
    this.presenter.initialize();
  }
}
