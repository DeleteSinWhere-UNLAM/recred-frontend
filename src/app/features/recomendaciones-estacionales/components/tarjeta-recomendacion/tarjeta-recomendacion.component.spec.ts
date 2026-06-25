import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TarjetaRecomendacionComponent } from './tarjeta-recomendacion.component';
import { Sugerencia } from '../../models/recomendacion.model';

describe('TarjetaRecomendacionComponent', () => {
  let component: TarjetaRecomendacionComponent;
  let fixture: ComponentFixture<TarjetaRecomendacionComponent>;

  const mockSugerencia: Sugerencia = {
    categoria: 'Test Categoria',
    accion: 'AUMENTAR',
    motivo: 'Test Motivo'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaRecomendacionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TarjetaRecomendacionComponent);
    component = fixture.componentInstance;
    component.item = mockSugerencia;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar la categoría', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.recommendation-card__titulo')?.textContent).toContain('Test Categoria');
  });
});
