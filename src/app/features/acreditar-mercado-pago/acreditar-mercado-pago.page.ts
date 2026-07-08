import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { AcreditarMercadoPagoPresenter } from './presenter/acreditar-mercado-pago.presenter';

@Component({
  selector: 'app-acreditar-mercado-pago-page',
  templateUrl: './acreditar-mercado-pago.page.html',
  styleUrl: './acreditar-mercado-pago.page.css',
  imports: [],
  providers: [AcreditarMercadoPagoPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcreditarMercadoPagoPage {
  private readonly contextoService = inject(AlumnoContextoService);
  protected readonly presenter = inject(AcreditarMercadoPagoPresenter);

  montoIngresado = 0;

  constructor() {
    effect(() => {
      const alumnoId = this.contextoService.alumnoId();
      void this.presenter.init(alumnoId);
    });
  }

  protected onMontoChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.montoIngresado = Number(target.value);
  }

  protected selectMonto(monto: number): void {
    this.montoIngresado = monto;
  }

  protected get saldoFormateado(): string {
    const saldo = this.presenter.alumno()?.saldo ?? 0;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(saldo);
  }

  protected get recargas() {
    return this.presenter.historialRecargas();
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void this.presenter.acreditar(this.montoIngresado);
  }
}
