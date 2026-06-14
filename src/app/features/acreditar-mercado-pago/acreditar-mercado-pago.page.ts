import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AcreditarMercadoPagoPresenter } from './presenter/acreditar-mercado-pago.presenter';

@Component({
  selector: 'app-acreditar-mercado-pago-page',
  templateUrl: './acreditar-mercado-pago.page.html',
  styleUrl: './acreditar-mercado-pago.page.css',
  imports: [NavbarComponent],
  providers: [AcreditarMercadoPagoPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcreditarMercadoPagoPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly presenter = inject(AcreditarMercadoPagoPresenter);

  montoIngresado = 0;

  ngOnInit(): void {
    const alumnoId = this.route.snapshot.paramMap.get('alumnoId') ?? '';
    void this.presenter.init(alumnoId);
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

  protected get recargas(): { id: string; montoFormateado: string; fechaFormateada: string; estado: string }[] {
    const nombre = this.presenter.alumno()?.nombre.toLowerCase() ?? '';
    if (nombre.includes('rocio')) {
      return [
        { id: 'rec-1', montoFormateado: '$3.000', fechaFormateada: '12 Jun, 15:30', estado: 'APROBADO' },
        { id: 'rec-2', montoFormateado: '$1.500', fechaFormateada: '05 Jun, 18:22', estado: 'APROBADO' },
        { id: 'rec-3', montoFormateado: '$2.000', fechaFormateada: '28 May, 10:05', estado: 'APROBADO' },
      ];
    }
    if (nombre.includes('emmanuel')) {
      return [
        { id: 'rec-1', montoFormateado: '$5.000', fechaFormateada: '13 Jun, 11:45', estado: 'APROBADO' },
        { id: 'rec-2', montoFormateado: '$2.000', fechaFormateada: '09 Jun, 14:10', estado: 'APROBADO' },
        { id: 'rec-3', montoFormateado: '$5.000', fechaFormateada: '01 Jun, 09:30', estado: 'APROBADO' },
      ];
    }
    return [
      { id: 'rec-1', montoFormateado: '$2.000', fechaFormateada: '10 Jun, 12:00', estado: 'APROBADO' },
      { id: 'rec-2', montoFormateado: '$1.000', fechaFormateada: '04 Jun, 16:30', estado: 'APROBADO' },
    ];
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void this.presenter.acreditar(this.montoIngresado);
  }
}
