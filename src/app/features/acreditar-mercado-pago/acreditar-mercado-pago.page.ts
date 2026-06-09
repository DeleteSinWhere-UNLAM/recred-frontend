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

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void this.presenter.acreditar(this.montoIngresado);
  }
}
