import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { RestriccionesHorariasPresenter, FranjaConRestricciones } from './presenter/restricciones-horarias.presenter';
import { PerfilService } from '../../data-access/services/perfil.service';

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
  private readonly perfilService = inject(PerfilService);

  protected readonly esPremium = computed(() => !this.perfilService.esPlanGratuito());
  protected readonly selectedFranjaId = signal<string>('');
  private hasInitializedFranja = false;

  constructor() {
    effect(() => {
      const slots = this.presenter.franjasConRestricciones();
      if (slots.length > 0 && !this.hasInitializedFranja) {
        this.selectedFranjaId.set(slots[0].franja.id);
        this.hasInitializedFranja = true;
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

  protected toggleAccordion(franjaId: string): void {
    if (this.selectedFranjaId() === franjaId) {
      this.selectedFranjaId.set('');
    } else {
      this.selectedFranjaId.set(franjaId);
    }
  }

  protected getNivel1Toggles(item: FranjaConRestricciones): QuickToggleItem[] {
    const categories = this.presenter.categorias();
    const health = this.presenter.catalogoSaludDisponible();
    const toggles: QuickToggleItem[] = [];

    // 1. Bebidas
    const catBebidas = categories.find(c => c.descripcion.toLowerCase().includes('bebida') || c.descripcion.toLowerCase().includes('gaseosa'));
    if (catBebidas) {
      const rest = item.restricciones.find(r => r.categoryId === catBebidas.id || r.categoria?.id === catBebidas.id);
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
      const rest = item.restricciones.find(r => r.categoryId === catSnacks.id || r.categoria?.id === catSnacks.id);
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
      const rest = item.restricciones.find(r => r.categoryId === catGolosinas.id || r.categoria?.id === catGolosinas.id);
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
      const rest = item.restricciones.find(r => r.classificationId === salTacc.id || r.clasificacionSalud?.id === salTacc.id);
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

    return toggles;
  }

  protected getNivel2Toggles(item: FranjaConRestricciones): (QuickToggleItem & { descripcion: string })[] {
    const health = this.presenter.catalogoSaludDisponible();
    const toggles: (QuickToggleItem & { descripcion: string })[] = [];

    // 1. TACC
    const salTacc = health.find(s => s.descripcion.toLowerCase().includes('tacc') || s.descripcion.toLowerCase().includes('gluten'));
    if (salTacc) {
      const rest = item.restricciones.find(r => r.classificationId === salTacc.id || r.clasificacionSalud?.id === salTacc.id);
      toggles.push({
        id: salTacc.id,
        titulo: 'TACC',
        descripcion: 'Bloquea productos con gluten.',
        tipo: 'SALUD',
        icon: 'fa-wheat-awn',
        color: 'red',
        checked: !!rest,
        restrictionId: rest?.id
      });
    }

    // 2. Azúcar
    const salAzucar = health.find(s => s.descripcion.toLowerCase().includes('azucar') || s.descripcion.toLowerCase().includes('diabet'));
    if (salAzucar) {
      const rest = item.restricciones.find(r => r.classificationId === salAzucar.id || r.clasificacionSalud?.id === salAzucar.id);
      toggles.push({
        id: salAzucar.id,
        titulo: 'Azúcar',
        descripcion: 'Perfil apto para diabéticos.',
        tipo: 'SALUD',
        icon: 'fa-cubes-stacked',
        color: 'blue-dark',
        checked: !!rest,
        restrictionId: rest?.id
      });
    }

    // 3. Sin Sodio
    const salSodio = health.find(s => s.descripcion.toLowerCase().includes('sodio') || s.descripcion.toLowerCase().includes('sal'));
    if (salSodio) {
      const rest = item.restricciones.find(r => r.classificationId === salSodio.id || r.clasificacionSalud?.id === salSodio.id);
      toggles.push({
        id: salSodio.id,
        titulo: 'Sin Sodio',
        descripcion: 'Bloquea productos con alto sodio.',
        tipo: 'SALUD',
        icon: 'fa-leaf',
        color: 'green',
        checked: !!rest,
        restrictionId: rest?.id
      });
    }

    // 4. Contiene Lácteos
    const salLacteos = health.find(s => s.descripcion.toLowerCase().includes('lacteo') || s.descripcion.toLowerCase().includes('leche'));
    if (salLacteos) {
      const rest = item.restricciones.find(r => r.classificationId === salLacteos.id || r.clasificacionSalud?.id === salLacteos.id);
      toggles.push({
        id: salLacteos.id,
        titulo: 'Contiene Lácteos',
        descripcion: 'Bloquea productos con lácteos.',
        tipo: 'SALUD',
        icon: 'fa-cow',
        color: 'orange-dark',
        checked: !!rest,
        restrictionId: rest?.id
      });
    }

    return toggles;
  }

  protected alternarToggle(toggle: QuickToggleItem, franjaId: string): void {
    if (toggle.checked && toggle.restrictionId) {
      this.presenter.quitarRestriccion(toggle.restrictionId);
    } else {
      const tipo = toggle.tipo === 'CATEGORIA' ? 'CATEGORIA' : 'SALUD';
      this.presenter.agregarRestriccion(franjaId, tipo, toggle.id);
    }
  }

  protected getRestriccionesSummaryText(item: FranjaConRestricciones): string {
    const count = item.restricciones.length;
    if (count === 0) return '0 restricciones activas';
    
    const catCount = item.restricciones.filter(r => r.categoryId || r.categoria).length;
    const saludCount = item.restricciones.filter(r => r.classificationId || r.clasificacionSalud).length;
    
    if (catCount > 0 && saludCount === 0) {
      return `${catCount} ${catCount === 1 ? 'bloqueo' : 'bloqueos'} de categoría`;
    } else if (saludCount > 0 && catCount === 0) {
      return `${saludCount} ${saludCount === 1 ? 'restricción' : 'restricciones'} de ingrediente`;
    } else {
      return `${count} restricciones activas`;
    }
  }

  protected async guardarCambios(): Promise<void> {
    const success = await this.presenter.guardarCambios();
    if (success) {
      this.location.back();
    }
  }
}
