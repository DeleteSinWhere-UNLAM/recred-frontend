import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeasonalListComponent } from './seasonal-list.component';
import { Sugerencia } from '../../models/recomendacion.model';

describe('SeasonalListComponent', () => {
  let component: SeasonalListComponent;
  let fixture: ComponentFixture<SeasonalListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonalListComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(SeasonalListComponent);
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
