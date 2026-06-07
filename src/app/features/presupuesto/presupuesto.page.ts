import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../data-access/services/usuario.service';
import {
  CambioPorcentaje,
  ReglaCategoriaItemComponent,
} from './components/regla-categoria-item/regla-categoria-item.component';
import { Periodo } from './models/presupuesto.model';
import { PresupuestoPresenter } from './presenter/presupuesto.presenter';

@Component({
  selector: 'app-presupuesto-page',
  templateUrl: './presupuesto.page.html',
  styleUrl: './presupuesto.page.css',
  imports: [
    NavbarComponent,
    ReglaCategoriaItemComponent,
  ],
  providers: [PresupuestoPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresupuestoPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly usuarioService = inject(UsuarioService);
  protected readonly presenter = inject(PresupuestoPresenter);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  ngOnInit(): void {
    const alumnoId = this.route.snapshot.paramMap.get('alumnoId') ?? '';
    void this.presenter.init(alumnoId);
  }

  protected etiquetaPeriodo(periodo: Periodo): string {
    const map: Record<Periodo, string> = {
      DIARIO: 'Diario',
      SEMANAL: 'Semanal',
      QUINCENAL: 'Quincenal',
      MENSUAL: 'Mensual',
    };
    return map[periodo];
  }

  protected onMontoChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.presenter.setMontoGeneral(Number(target.value));
  }

  protected onPeriodoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.presenter.setPeriodo(target.value as Periodo);
  }

  protected onFechaChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.presenter.setFechaInicio(target.value);
  }

  protected onAgregarRegla(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (!target.value) return;
    this.presenter.agregarReglaCategoria(target.value);
    target.value = '';
  }

  protected onPorcentajeChange(cambio: CambioPorcentaje): void {
    this.presenter.setPorcentajeRegla(cambio.reglaId, cambio.porcentaje);
  }

  protected onEliminarRegla(reglaId: string): void {
    this.presenter.eliminarRegla(reglaId);
  }

  protected get totalPorcentajeAcotado(): number {
    return Math.min(this.presenter.totalPorcentaje(), 100);
  }
}
