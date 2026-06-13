import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { RestriccionesHorariasPresenter } from './presenter/restricciones-horarias.presenter';

@Component({
  selector: 'app-restricciones-horarias-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './restricciones-horarias.page.html',
  styleUrl: './restricciones-horarias.page.css',
  providers: [RestriccionesHorariasPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestriccionesHorariasPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  protected readonly presenter = inject(RestriccionesHorariasPresenter);

  ngOnInit(): void {
    const alumnoId = this.route.snapshot.paramMap.get('alumnoId');
    if (alumnoId) {
      this.presenter.init(alumnoId);
    }
  }

  volver(): void {
    this.location.back();
  }

  agregar(franjaId: string, seleccion: string): void {
    if (!seleccion) return;
    
    if (seleccion === 'ALL:all') {
      this.presenter.agregarRestriccion(franjaId, 'TOTAL');
      return;
    }

    const [tipoPrefix, valorId] = seleccion.split(':');
    const tipo = tipoPrefix === 'CAT' ? 'CATEGORIA' : 'SALUD';
    
    this.presenter.agregarRestriccion(franjaId, tipo, valorId);
  }
}
