import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferenciaCardComponent } from './preferencia-card.component';
import { Preferencia } from '../../models/preferencia.model';

describe('PreferenciaCardComponent', () => {
  let componente: PreferenciaCardComponent;
  let fixture: ComponentFixture<PreferenciaCardComponent>;

  const mockPreferencia = {
    titulo: 'Preferencia salada',
    mensaje: 'Consume galletas de agua',
    razonIA: 'Patrón matutino'
  } as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreferenciaCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PreferenciaCardComponent);
    componente = fixture.componentInstance;
    componente.preferencia = mockPreferencia;
    fixture.detectChanges();
  });

  it('dado que se proporciona el input, debe renderizar correctamente sus propiedades', () => {
    const html = fixture.nativeElement.innerHTML;
    expect(html).toContain('Preferencia salada');
    expect(html).toContain('Consume galletas de agua');
    expect(html).toContain('Patrón matutino');
  });
});
