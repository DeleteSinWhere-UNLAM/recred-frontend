import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SugerenciaCardComponent } from './sugerencia-card.component';
import { SugerenciaProducto } from '../../models/sugerencia-producto.model';
import { SugerenciasMother } from '../../sugerencias.mother';

describe('SugerenciaCardComponent', () => {
  let component: SugerenciaCardComponent;
  let fixture: ComponentFixture<SugerenciaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SugerenciaCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SugerenciaCardComponent);
    component = fixture.componentInstance;
    component.sugerencia = SugerenciasMother.crearSugerencia();
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería emitir el evento seleccionar al llamar a onSeleccionar', () => {
    spyOn(component.seleccionar, 'emit');
    whenHagoClickEnSeleccionar();
    thenSeEmiteElEventoSeleccionar();
  });

  function whenHagoClickEnSeleccionar(): void {
    component.onSeleccionar();
  }

  function thenSeEmiteElEventoSeleccionar(): void {
    expect(component.seleccionar.emit).toHaveBeenCalledWith(component.sugerencia);
  }
});
