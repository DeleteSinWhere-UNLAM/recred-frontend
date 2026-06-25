import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  computed,
  signal,
  inject,
} from '@angular/core';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { Colegio } from '../../../../data-access/models/colegio.model';
import { UsuarioService } from '../../../../data-access/services/usuario.service';

@Component({
  selector: 'app-seleccionar-alumno-modal',
  templateUrl: './seleccionar-alumno-modal.component.html',
  styleUrl: './seleccionar-alumno-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeleccionarAlumnoModalComponent {
  private readonly usuarioService = inject(UsuarioService);
  protected readonly esVistaAlumno = this.usuarioService.esVistaAlumno;
  private readonly alumnosState = signal<Alumno[]>([]);
  private readonly colegiosState = signal<Colegio[]>([]);

  @Input({ required: true })
  set alumnos(valor: Alumno[]) {
    this.alumnosState.set(valor);
  }

  @Input({ required: true })
  set colegios(valor: Colegio[]) {
    this.colegiosState.set(valor);
  }

  @Input() alumnoActualId = '';

  @Output() seleccionar = new EventEmitter<string>();
  @Output() cerrar = new EventEmitter<void>();

  readonly alumnosActuales = computed(() => this.alumnosState());

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.cerrar.emit();
  }

  protected iniciales(alumno: Alumno): string {
    if (this.esVistaAlumno()) {
      return ((alumno.nombre[0] ?? '') + (alumno.apellido[0] ?? '')).toUpperCase();
    }
    return (alumno.nombre[0] ?? '').toUpperCase();
  }

  protected nombreColegio(colegioId: string): string {
    return this.colegiosState().find((c) => c.id === colegioId)?.nombre ?? '';
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cerrar.emit();
    }
  }
}
