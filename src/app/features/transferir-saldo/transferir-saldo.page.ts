import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { TransferirSaldoPresenter } from './presenter/transferir-saldo.presenter';

@Component({
  selector: 'app-transferir-saldo-page',
  standalone: true,
  templateUrl: './transferir-saldo.page.html',
  styleUrl: './transferir-saldo.page.css',
  imports: [FormsModule],
  providers: [TransferirSaldoPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransferirSaldoPage {
  private readonly contextoService = inject(AlumnoContextoService);
  protected readonly presenter = inject(TransferirSaldoPresenter);

  montoIngresado = 0;
  destinoAlumnoId = '';

  constructor() {
    effect(() => {
      const alumnoId = this.contextoService.alumnoId();
      if (alumnoId) {
        void this.presenter.init(alumnoId);
      }
    });
  }

  protected selectMonto(monto: number): void {
    this.montoIngresado = monto;
  }

  protected get saldoFormateado(): string {
    const saldo = this.presenter.alumnoOrigen()?.saldo ?? 0;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(saldo);
  }

  protected get transferencias() {
    return this.presenter.historialTransferencias();
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.presenter.transferir(this.destinoAlumnoId, this.montoIngresado).then((exito) => {
      if (exito) {
        this.montoIngresado = 0;
        this.destinoAlumnoId = '';
      }
    });
  }
}
