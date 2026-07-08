import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AccionKiosquero } from '../../models/accion-kiosquero.model';
import { AccionCardComponent } from '../accion-card/accion-card.component';
import { AccionesGridComponent } from './acciones-grid.component';

class AccionKiosqueroMother {
  static crearVerPedidos(): AccionKiosquero {
    return {
      id: 'ver-pedidos',
      titulo: 'Ver pedidos',
      descripcion: 'Gestioná las órdenes del día',
      icono: 'fa-clipboard-list',
      ruta: '/kiosquero/pedidos',
      color: 'menta',
    };
  }

  static crearCierreDiarioDestacada(): AccionKiosquero {
    return {
      id: 'cierre-diario',
      titulo: 'Cierre diario',
      descripcion: 'Cerrá tu jornada',
      icono: 'fa-flag-checkered',
      ruta: '/kiosquero/cierre-diario',
      color: 'dorado',
      destacada: true,
    };
  }
}

@Component({ selector: 'app-accion-card', template: '', standalone: true })
class AccionCardStub {
  @Input() accion!: AccionKiosquero;
  @Output() seleccionar = new EventEmitter<AccionKiosquero>();
}

describe('AccionesGridComponent (home-kiosquero)', () => {
  let component: AccionesGridComponent;
  let fixture: ComponentFixture<AccionesGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccionesGridComponent],
    })
      .overrideComponent(AccionesGridComponent, {
        remove: { imports: [AccionCardComponent] },
        add: { imports: [AccionCardStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AccionesGridComponent);
    component = fixture.componentInstance;
    component.acciones = [
      AccionKiosqueroMother.crearVerPedidos(),
      AccionKiosqueroMother.crearCierreDiarioDestacada(),
    ];
    fixture.detectChanges();
  });

  describe('render', () => {
    it('dado el grid, cuando se monta, deberia renderizar el titulo "Tus herramientas"', () => {
      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(texto).toContain('Tus herramientas');
    });

    it('dado 2 acciones, cuando se monta, deberia renderizar 2 app-accion-card', () => {
      const cards = fixture.debugElement.queryAll(By.directive(AccionCardStub));

      expect(cards.length).toBe(2);
    });

    it('dado una accion destacada, cuando se monta, deberia aplicar la clase acciones-grid__item--full', () => {
      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('app-accion-card');

      expect(cards[1].classList.contains('acciones-grid__item--full')).toBeTrue();
      expect(cards[0].classList.contains('acciones-grid__item--full')).toBeFalse();
    });
  });

  describe('interaccion', () => {
    it('dado una accion, cuando la card emite seleccionar, deberia reemitir por accion', () => {
      const spy = jasmine.createSpy('accion');
      component.accion.subscribe(spy);

      whenLaCardEmiteSeleccionar(component.acciones[0]);

      expect(spy).toHaveBeenCalledWith(component.acciones[0]);
    });
  });

  function whenLaCardEmiteSeleccionar(accion: AccionKiosquero): void {
    const card = fixture.debugElement.query(By.directive(AccionCardStub))
      .componentInstance as AccionCardStub;
    card.seleccionar.emit(accion);
  }
});
