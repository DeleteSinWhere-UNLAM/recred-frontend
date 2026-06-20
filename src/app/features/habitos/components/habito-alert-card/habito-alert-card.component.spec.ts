import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HabitoAlertCardComponent } from './habito-alert-card.component';
import { HabitoAlerta } from '../../models/habito-alerta.model';

describe('HabitoAlertCardComponent', () => {
  let componente: HabitoAlertCardComponent;
  let fixture: ComponentFixture<HabitoAlertCardComponent>;

  const mockAlerta = {
    alumno: 'Juanito',
    mensaje: 'Consumo excesivo de azúcares',
    categoria: 'Golosinas',
    porcentajeGasto: 45,
    sugerencia: 'Intentar cambiar por fruta'
  } as any;

  beforeEach(async () => {
    // Si usaba ngModule
    await TestBed.configureTestingModule({
      imports: [HabitoAlertCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HabitoAlertCardComponent);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('alerta', mockAlerta);
    fixture.detectChanges();
  });

  it('dado que recibe una alerta, debe renderizar correctamente en el DOM', () => {
    const html = fixture.nativeElement.innerHTML;
    expect(html).toContain('Juanito');
    expect(html).toContain('Consumo excesivo de azúcares');
    expect(html).toContain('Golosinas');
    expect(html).toContain('45%');
    expect(html).toContain('Intentar cambiar por fruta');
  });
});