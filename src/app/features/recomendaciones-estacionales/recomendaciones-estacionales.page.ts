import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListaEstacionalComponent } from './components/lista-estacional/lista-estacional.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { RecomendacionesEstacionalesPresenter } from './presenter/recomendaciones-estacionales.presenter';
import { ModalAprobacionPromocionIaComponent } from './components/modal-aprobacion-promocion-ia/modal-aprobacion-promocion-ia.component';

@Component({
  selector: 'app-recomendaciones-estacionales-page',
  standalone: true,
  imports: [CommonModule, ListaEstacionalComponent, NavbarComponent, ModalAprobacionPromocionIaComponent],
  providers: [RecomendacionesEstacionalesPresenter],
  templateUrl: './recomendaciones-estacionales.page.html',
  styleUrls: ['./recomendaciones-estacionales.page.css']
})
export class RecomendacionesEstacionalesPage implements OnInit {
  protected readonly presenter = inject(RecomendacionesEstacionalesPresenter);

  ngOnInit(): void {
    this.presenter.loadRecommendations();
  }
}
