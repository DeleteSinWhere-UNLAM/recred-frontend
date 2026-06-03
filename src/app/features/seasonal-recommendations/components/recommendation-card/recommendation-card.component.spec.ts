import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecommendationCardComponent } from './recommendation-card.component';
import { Sugerencia } from '../../models/recomendacion.model';

describe('RecommendationCardComponent', () => {
  let component: RecommendationCardComponent;
  let fixture: ComponentFixture<RecommendationCardComponent>;

  const mockSugerencia: Sugerencia = {
    categoria: 'Test Categoria',
    accion: 'AUMENTAR',
    motivo: 'Test Motivo'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendationCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecommendationCardComponent);
    component = fixture.componentInstance;
    component.item = mockSugerencia;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar la categoría y el motivo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.recommendation-card__titulo')?.textContent).toContain('Test Categoria');
    expect(compiled.querySelector('.recommendation-card__motivo')?.textContent).toContain('Test Motivo');
  });
});
