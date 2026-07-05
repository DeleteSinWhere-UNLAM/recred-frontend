import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AccionRapida } from '../../models/accion-rapida.model';
import { AccionRapidaMother } from '../../home-alumno.mother';
import { AccionTileComponent } from '../accion-tile/accion-tile.component';
import { AccionesGridComponent } from './acciones-grid.component';

@Component({ selector: 'app-accion-tile', template: '', standalone: true })
class AccionTileStub {
  @Input() accion!: AccionRapida;
  @Output() seleccionar = new EventEmitter<AccionRapida>();
}

describe('AccionesGridComponent', () => {
  let component: AccionesGridComponent;
  let fixture: ComponentFixture<AccionesGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccionesGridComponent],
    })
      .overrideComponent(AccionesGridComponent, {
        remove: { imports: [AccionTileComponent] },
        add: { imports: [AccionTileStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AccionesGridComponent);
    component = fixture.componentInstance;
    component.acciones = [
      AccionRapidaMother.crearBuffet(),
      AccionRapidaMother.crearFavoritos(),
    ];
    fixture.detectChanges();
  });

  describe('render', () => {
    it('dado una lista de acciones, cuando se monta, deberia renderizar el titulo', () => {
      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('¿Qué querés hacer hoy?');
    });

    it('dado 2 acciones, deberia renderizar 2 app-accion-tile', () => {
      const tiles = fixture.debugElement.queryAll(By.directive(AccionTileStub));
      expect(tiles.length).toBe(2);
    });
  });

  describe('interaccion', () => {
    it('dado una accion, cuando un tile emite seleccionar, deberia reemitir por accion', () => {
      const spy = jasmine.createSpy('accion');
      component.accion.subscribe(spy);
      const tile = fixture.debugElement.query(By.directive(AccionTileStub))
        .componentInstance as AccionTileStub;

      tile.seleccionar.emit(component.acciones[0]);

      expect(spy).toHaveBeenCalledWith(component.acciones[0]);
    });
  });
});
