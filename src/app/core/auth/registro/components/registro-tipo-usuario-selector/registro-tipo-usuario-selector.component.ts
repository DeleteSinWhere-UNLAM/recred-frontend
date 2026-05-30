import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { TipoUsuario } from '../../models/tipo-usuario.model';

interface OpcionTipo {
  readonly id: TipoUsuario;
  readonly label: string;
}

@Component({
  selector: 'app-registro-tipo-usuario-selector',
  templateUrl: './registro-tipo-usuario-selector.component.html',
  styleUrl: './registro-tipo-usuario-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroTipoUsuarioSelectorComponent {
  @Input() etiqueta = 'Tipo de cuenta';
  @Input() valor: TipoUsuario | null = null;
  @Output() valorCambiado = new EventEmitter<TipoUsuario>();

  protected readonly opciones: readonly OpcionTipo[] = [
    { id: 'tutor', label: 'Tutor' },
    { id: 'kiosquero', label: 'Kiosquero' },
  ];

  protected onSeleccionar(id: TipoUsuario): void {
    if (this.valor === id) return;
    this.valorCambiado.emit(id);
  }
}
