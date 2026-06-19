import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecommendationCardComponent } from './recommendation-card.component';
import { Sugerencia } from '../../models/recomendacion.model';

describe('RecommendationCardComponent', () => {
  let component: RecommendationCardComponent;
  let fixture: ComponentFixture<RecommendationCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendationCardComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(RecommendationCardComponent);
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
