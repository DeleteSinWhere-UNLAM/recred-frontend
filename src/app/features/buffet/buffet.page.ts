import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { ColegiosService } from '../../data-access/services/colegios.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ProductoCardComponent } from './components/producto-card/producto-card.component';
import { SeleccionarAlumnoModalComponent } from './components/seleccionar-alumno-modal/seleccionar-alumno-modal.component';
import { BuffetPresenter } from './presenter/buffet.presenter';
import { Recreo } from '../compra/models/orden-compra.model';

export interface DateCell {
  date: Date;
  fechaStr: string;
  nroDia: number;
  fueraDeMes: boolean;
  esFinDeSemana: boolean;
  bloqueado: boolean;
  seleccionada: boolean;
}

@Component({
  selector: 'app-buffet-page',
  templateUrl: './buffet.page.html',
  styleUrl: './buffet.page.css',
  imports: [NavbarComponent, ProductoCardComponent, SeleccionarAlumnoModalComponent],
  providers: [BuffetPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuffetPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly colegiosService = inject(ColegiosService);
  protected readonly presenter = inject(BuffetPresenter);

  readonly nombreUsuario = this.usuarioService.nombreNavbar;
  protected readonly esVistaAlumno = this.usuarioService.esVistaAlumno;
  readonly todosLosAlumnos = this.alumnosService.alumnos;
  readonly todosLosColegios = this.colegiosService.getColegios();

  protected readonly mostrarSelector = signal(false);
  protected readonly panelLateralCerrado = signal<boolean>(false);
  protected readonly diasCalendario = signal<DateCell[]>([]);

  constructor() {
    effect(() => {
      const selectedDate = this.presenter.fechaSeleccionada();
      if (selectedDate) {
        this.generateCalendar(selectedDate);
      }
    });
  }

  ngOnInit(): void {
    this.usuarioService.setHomeUrl(this.homeUrlPorRol());
    const alumnoId = this.route.snapshot.paramMap.get('alumnoId') ?? '';
    void this.inicializarBuffet(alumnoId);
  }

  private async inicializarBuffet(alumnoId: string): Promise<void> {
    try {
      await this.alumnosService.asegurarCargados(true);
    } catch (err) {
      console.error('Error al cargar alumnos para el buffet:', err);
    }

    this.presenter.init(alumnoId);
  }

  protected onBusqueda(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.presenter.buscar(target.value);
  }

  protected onCategoria(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.presenter.seleccionarCategoria(target.value);
  }

  protected onClasificacion(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.presenter.seleccionarClasificacion(target.value);
  }

  protected onToggleSoloFavoritos(): void {
    this.presenter.toggleSoloFavoritos();
  }

  protected onPrecioMinCambia(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = target.value ? parseFloat(target.value) : null;
    this.presenter.setPrecioMin(val);
  }

  protected onPrecioMaxCambia(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = target.value ? parseFloat(target.value) : null;
    this.presenter.setPrecioMax(val);
  }

  protected abrirSelector(): void {
    this.mostrarSelector.set(true);
  }

  protected cerrarSelector(): void {
    this.mostrarSelector.set(false);
  }

  protected onAlumnoSeleccionado(alumnoId: string): void {
    this.cerrarSelector();
    this.presenter.cambiarAlumno(alumnoId);
  }

  protected onFechaCambia(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.presenter.setFecha(target.value);
  }

  protected onRecreoCambia(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.presenter.setRecreo(target.value as Recreo);
  }

  protected get saldoFormateado(): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
    }).format(this.presenter.saldo());
  }

  protected formatARS(monto: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(monto);
  }

  protected formatFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
  }

  protected readonly nombreMesCalendario = computed(() => {
    const selectedDate = this.presenter.fechaSeleccionada();
    if (!selectedDate) return '';
    const date = new Date(selectedDate + 'T12:00:00');
    const formatted = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  });

  protected generateCalendar(referenceDateStr: string): void {
    if (!referenceDateStr) return;
    const refDate = new Date(referenceDateStr + 'T12:00:00');
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 7 : startDayOfWeek;
    
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - (startDayOfWeek - 1));
    
    const cells: DateCell[] = [];
    const minDateStr = this.presenter.fechaMinima();
    const selectedDateStr = this.presenter.fechaSeleccionada();
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      const fechaStr = `${yyyy}-${mm}-${dd}`;
      
      const dayOfWeek = currentDate.getDay();
      const esFinDeSemana = dayOfWeek === 0 || dayOfWeek === 6;
      
      const bloqueado = fechaStr < minDateStr || esFinDeSemana;
      
      cells.push({
        date: currentDate,
        fechaStr,
        nroDia: currentDate.getDate(),
        fueraDeMes: currentDate.getMonth() !== month,
        esFinDeSemana,
        bloqueado,
        seleccionada: fechaStr === selectedDateStr
      });
    }
    
    this.diasCalendario.set(cells);
  }

  protected seleccionarDiaCalendario(cell: DateCell): void {
    if (cell.bloqueado) return;
    this.presenter.setFecha(cell.fechaStr);
  }

  private homeUrlPorRol(): string {
    const rol = this.perfilService.rol();
    if (rol === 'ALUMNO') return '/alumno';
    if (rol === 'VENDEDOR') return '/kiosquero';
    return '/tutor';
  }

  protected obtenerRangoHorario(recreo: Recreo): string {
    const slot = this.presenter.franjas().find(s => {
      if (!s.descripcion) return false;
      const desc = s.descripcion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (recreo === 'PRIMER_RECREO') return desc.includes('primer') && desc.includes('recreo');
      if (recreo === 'SEGUNDO_RECREO') return desc.includes('segundo') && desc.includes('recreo');
      if (recreo === 'MEDIODIA') return desc.includes('mediodia') || desc.includes('medio dia') || desc.includes('almuerzo');
      if (recreo === 'FUERA_HORA') return desc.includes('salida') || desc.includes('despues') || desc.includes('final');
      return false;
    });
    
    if (slot && slot.horaInicio && slot.horaFin) {
      const formatTime = (timeStr: string) => {
        const parts = timeStr.split(':');
        return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr;
      };
      return `${formatTime(slot.horaInicio)} - ${formatTime(slot.horaFin)}`;
    }
    return '';
  }
}
