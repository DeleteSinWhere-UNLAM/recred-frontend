import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { RestriccionesHorariasPresenter, FranjaConRestricciones } from './presenter/restricciones-horarias.presenter';
import { RestriccionHoraria } from './models/restriccion-horaria.model';

export interface QuickToggleItem {
  id: string;
  titulo: string;
  tipo: 'CATEGORIA' | 'SALUD';
  icon: string;
  color: string;
  checked: boolean;
  restrictionId?: string;
}


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

  protected readonly activeItem = computed(() => {
    const franjas = this.presenter.franjasConRestricciones();
    return franjas.find(item => item.franja.id === this.selectedFranjaId()) || franjas[0];
  });

  protected readonly quickToggles = computed(() => {
    const active = this.activeItem();
    if (!active) return [];

    const categories = this.presenter.categorias();
    const health = this.presenter.catalogoSaludDisponible();

    const toggles: QuickToggleItem[] = [];

    // 1. Bebidas
    const catBebidas = categories.find(c => c.descripcion.toLowerCase().includes('bebida') || c.descripcion.toLowerCase().includes('gaseosa'));
    if (catBebidas) {
      const rest = active.restricciones.find(r => r.categoryId === catBebidas.id || r.categoria?.id === catBebidas.id);
      toggles.push({
        id: catBebidas.id,
        titulo: 'Bebidas',
        tipo: 'CATEGORIA',
        icon: 'fa-glass-water',
        color: 'blue',
        checked: !!rest,
        restrictionId: rest?.id
      });
    }

    // 2. Snacks
    const catSnacks = categories.find(c => c.descripcion.toLowerCase().includes('snack') || c.descripcion.toLowerCase().includes('papa'));
    if (catSnacks) {
      const rest = active.restricciones.find(r => r.categoryId === catSnacks.id || r.categoria?.id === catSnacks.id);
      toggles.push({
        id: catSnacks.id,
        titulo: 'Snacks',
        tipo: 'CATEGORIA',
        icon: 'fa-cookie',
        color: 'yellow',
        checked: !!rest,
        restrictionId: rest?.id
      });
    }

    // 3. Golosinas
    const catGolosinas = categories.find(c => c.descripcion.toLowerCase().includes('golosina') || c.descripcion.toLowerCase().includes('dulce') || c.descripcion.toLowerCase().includes('chocolate'));
    if (catGolosinas) {
      const rest = active.restricciones.find(r => r.categoryId === catGolosinas.id || r.categoria?.id === catGolosinas.id);
      toggles.push({
        id: catGolosinas.id,
        titulo: 'Golosinas',
        tipo: 'CATEGORIA',
        icon: 'fa-candy-cane',
        color: 'orange',
        checked: !!rest,
        restrictionId: rest?.id
      });
    }

    // 4. Gluten / TACC
    const salTacc = health.find(s => s.descripcion.toLowerCase().includes('tacc') || s.descripcion.toLowerCase().includes('gluten'));
    if (salTacc) {
      const rest = active.restricciones.find(r => r.classificationId === salTacc.id || r.clasificacionSalud?.id === salTacc.id);
      toggles.push({
        id: salTacc.id,
        titulo: 'Gluten / TACC',
        tipo: 'SALUD',
        icon: 'fa-wheat-awn',
        color: 'red',
        checked: !!rest,
        restrictionId: rest?.id
      });
    }

    // 5. Azúcar
    const salAzucar = health.find(s => s.descripcion.toLowerCase().includes('azucar') || s.descripcion.toLowerCase().includes('diabet'));
    if (salAzucar) {
      const rest = active.restricciones.find(r => r.classificationId === salAzucar.id || r.clasificacionSalud?.id === salAzucar.id);
      toggles.push({
        id: salAzucar.id,
        titulo: 'Azúcar',
        tipo: 'SALUD',
        icon: 'fa-cubes-stacked',
        color: 'blue-dark',
        checked: !!rest,
        restrictionId: rest?.id
      });
    }

    // 6. Lácteos
    const salLacteos = health.find(s => s.descripcion.toLowerCase().includes('lacteo') || s.descripcion.toLowerCase().includes('leche'));
    if (salLacteos) {
      const rest = active.restricciones.find(r => r.classificationId === salLacteos.id || r.clasificacionSalud?.id === salLacteos.id);
      toggles.push({
        id: salLacteos.id,
        titulo: 'Lácteos',
        tipo: 'SALUD',
        icon: 'fa-cow',
        color: 'orange-dark',
        checked: !!rest,
        restrictionId: rest?.id
      });
    }

    return toggles;
  });

  constructor() {
    effect(() => {
      const slots = this.presenter.franjasConRestricciones();
      if (slots.length > 0 && !this.selectedFranjaId()) {
        this.selectedFranjaId.set(slots[0].franja.id);
      }
    });
  }

  ngOnInit(): void {
    const alumnoId = this.route.snapshot.paramMap.get('alumnoId');
    if (alumnoId) {
      void this.presenter.init(alumnoId);
    }
  }

  volver(): void {
    this.location.back();
  }

  protected isQuickToggle(res: RestriccionHoraria): boolean {
    const toggles = this.quickToggles();
    const id = res.categoryId || res.classificationId || res.categoria?.id || res.clasificacionSalud?.id;
    return toggles.some(t => t.id === id);
  }

  protected alternarToggle(toggle: QuickToggleItem): void {
    const active = this.activeItem();
    if (!active) return;

    if (toggle.checked && toggle.restrictionId) {
      void this.presenter.quitarRestriccion(toggle.restrictionId);
    } else {
      const tipo = toggle.tipo === 'CATEGORIA' ? 'CATEGORIA' : 'SALUD';
      void this.presenter.agregarRestriccion(active.franja.id, tipo, toggle.id);
    }
  }

  protected quitarBloqueoTotal(item: FranjaConRestricciones): void {
    const rTotal = item.restricciones.find((r: RestriccionHoraria) => !r.categoryId && !r.classificationId && !r.categoria && !r.clasificacionSalud);
    if (rTotal) {
      void this.presenter.quitarRestriccion(rTotal.id);
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
