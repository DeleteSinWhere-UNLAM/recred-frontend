import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { FondoPerfil } from '../../models/fondo-perfil.model';

interface OpcionFondo {
  readonly id: FondoPerfil;
  readonly label: string;
  readonly preview: string;
  readonly previewEsImagen: boolean;
}

@Component({
  selector: 'app-perfil-header',
  templateUrl: './perfil-header.component.html',
  styleUrl: './perfil-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilHeaderComponent {
  @Input({ required: true }) iniciales = '';
  @Input({ required: true }) nombreCompleto = '';
  @Input() urlFotoPerfil: string | null = null;
  @Input({ required: true }) grado = '';
  @Input({ required: true }) colegio = '';
  @Input({ required: true }) saldoFormateado = '';
  @Input() saldoNegativo = false;
  @Input() fondo: FondoPerfil = 'nubes';

  @Output() readonly cambioFondo = new EventEmitter<FondoPerfil>();

  readonly menuAbierto = signal(false);

  get nombreLargo(): boolean {
    return this.nombreCompleto.length > 20;
  }

  readonly opciones: readonly OpcionFondo[] = [
    { id: 'nubes',       label: 'Nubes',         preview: '/nube.png',        previewEsImagen: true },
    { id: 'minecraft',   label: 'Minecraft',     preview: '/creeper.png',     previewEsImagen: true },
    { id: 'dragonballz', label: 'Dragon Ball Z', preview: '/dragonballz.png', previewEsImagen: true },
    { id: 'gato',        label: 'Gato',          preview: '/gato.png',        previewEsImagen: true },
    { id: 'messi',       label: 'Messi',         preview: '/messi.png',       previewEsImagen: true },
  ];

  alternarMenu(): void {
    this.menuAbierto.update((v) => !v);
  }

  elegirFondo(fondo: FondoPerfil): void {
    this.cambioFondo.emit(fondo);
    this.menuAbierto.set(false);
  }
}
