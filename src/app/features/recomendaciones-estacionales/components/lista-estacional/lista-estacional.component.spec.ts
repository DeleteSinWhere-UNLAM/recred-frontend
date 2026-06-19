import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListaEstacionalComponent } from './lista-estacional.component';
import { Sugerencia } from '../../models/recomendacion.model';

describe('ListaEstacionalComponent', () => {
  let component: ListaEstacionalComponent;
  let fixture: ComponentFixture<ListaEstacionalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaEstacionalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ListaEstacionalComponent);
    component = fixture.componentInstance;
  });

  it('dado que se inicializa sin datos, deberia tener valores por defecto', () => {
    fixture.detectChanges();
    expect(component.sugerencias).toEqual([]);
    expect(component.tipPromocional).toBeNull();
  });

  it('dado que recibe datos, deberia setear sugerencias y tipPromocional', () => {
    const mockSugerencias: Sugerencia[] = [
      { categoria: 'A', accion: 'A', motivo: 'M' }
    ];
    component.sugerencias = mockSugerencias;
    component.tipPromocional = 'Test Tip';
    fixture.detectChanges();
    expect(component.sugerencias).toEqual(mockSugerencias);
    expect(component.tipPromocional).toBe('Test Tip');
  });
});
