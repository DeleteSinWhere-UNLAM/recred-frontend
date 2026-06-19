import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecomendacionCardComponent } from './recomendacion-card.component';
import { Sugerencia } from '../../models/recomendacion.model';

describe('RecomendacionCardComponent', () => {
  let component: RecomendacionCardComponent;
  let fixture: ComponentFixture<RecomendacionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecomendacionCardComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(RecomendacionCardComponent);
    component = fixture.componentInstance;
  });

  it('dado que se inicializa, deberia asignar item correctamente', () => {
    const mockSugerencia: Sugerencia = {
      categoria: 'TEST_CAT',
      accion: 'TEST_ACCION',
      motivo: 'TEST_MOTIVO'
    };
    component.item = mockSugerencia;
    fixture.detectChanges();
    expect(component.item).toEqual(mockSugerencia);
  });
});
