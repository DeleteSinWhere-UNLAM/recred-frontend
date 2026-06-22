import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { RestriccionesHorariasPresenter, FranjaConRestricciones } from './presenter/restricciones-horarias.presenter';
import { RestriccionHoraria } from './models/restriccion-horaria.model';




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

  protected readonly selectedFranjaId = signal<string>('');

  protected  readonly activeItem = computed(() => {
    const franjas = this.presenter.franjasConRestricciones();
    if (franjas.length === 0) return undefined;
    return franjas.find(item => item.franja.id === this.selectedFranjaId()) || franjas[0];
  });

  readonly currentIndex = computed(() => {
    const franjas = this.presenter.franjasConRestricciones();
    const id = this.selectedFranjaId() || franjas[0]?.franja.id;
    return franjas.findIndex(f => f.franja.id === id);
  });

  readonly puedeAnterior = computed(() => this.currentIndex() > 0);
  
  readonly puedeSiguiente = computed(() => {
    const franjas = this.presenter.franjasConRestricciones();
    return this.currentIndex() >= 0 && this.currentIndex() < franjas.length - 1;
  });

  anteriorFranja(): void {
    if (this.puedeAnterior()) {
      const franjas = this.presenter.franjasConRestricciones();
      this.selectedFranjaId.set(franjas[this.currentIndex() - 1].franja.id);
    }
  }

  siguienteFranja(): void {
    if (this.puedeSiguiente()) {
      const franjas = this.presenter.franjasConRestricciones();
      this.selectedFranjaId.set(franjas[this.currentIndex() + 1].franja.id);
    }
  }



  constructor() {
    effect(() => {
      const slots = this.presenter.franjasConRestricciones();
      if (slots.length > 0 && !this.selectedFranjaId()) {
        this.selectedFranjaId.set(slots[0].franja.id);
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const alumnoId = params.get('alumnoId');
      if (alumnoId) {
        void this.presenter.init(alumnoId);
      }
    });
  }

  volver(): void {
    this.location.back();
  }



  protected quitarBloqueoTotal(item: any): void {
    const resTotal = item.restricciones.find((r: any) => !r.categoria && !r.clasificacionSalud && !r.categoryId && !r.classificationId);
    if (resTotal) {
      void this.presenter.quitarRestriccion(resTotal.id);
    }
  }

  async alternarBloqueoTotal(slot: FranjaConRestricciones): Promise<void> {
    if (slot.tieneBloqueoTotal) {
      const resTotal = slot.restricciones.find(r => !r.categoryId && !r.classificationId && !r.categoria && !r.clasificacionSalud);
      if (resTotal) {
        await this.presenter.quitarRestriccion(resTotal.id);
      }
    } else {
      await this.presenter.agregarRestriccion(slot.franja.id, 'TOTAL');
    }
  }


  agregar(franjaId: string, seleccion: string): void {
    if (!seleccion) return;
    
    if (seleccion === 'ALL:all') {
      void this.presenter.agregarRestriccion(franjaId, 'TOTAL');
      return;
    }

    const [tipoPrefix, valorId] = seleccion.split(':');
    const tipo = tipoPrefix === 'CAT' ? 'CATEGORIA' : 'SALUD';
    
    void this.presenter.agregarRestriccion(franjaId, tipo, valorId);
  }
}
