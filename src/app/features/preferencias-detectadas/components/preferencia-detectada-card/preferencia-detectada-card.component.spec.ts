import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferenciaDetectadaCardComponent } from './preferencia-detectada-card.component';
import { PreferenciaDetectada } from '../../models/preferencia-detectada.model';

describe('PreferenciaDetectadaCardComponent', () => {
  let componente: PreferenciaDetectadaCardComponent;
  let fixture: ComponentFixture<PreferenciaDetectadaCardComponent>;

  const mockPreferencia = {
    titulo: 'Le gusta lo dulce',
    mensaje: 'El alumno compra alfajores seguidos',
    razonIA: 'Análisis de últimas 10 compras arroja 80% dulce'
  } as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreferenciaDetectadaCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PreferenciaDetectadaCardComponent);
    componente = fixture.componentInstance;
    
    // Asignamos el input requerido antes del primer detectChanges
    componente.preferencia = mockPreferencia;
    fixture.detectChanges();
  });

  it('dado que se crea con el Input, debe renderizar titulo y mensaje', () => {
    const html = fixture.nativeElement.innerHTML;
    expect(html).toContain('Le gusta lo dulce');
    expect(html).toContain('alfajores seguidos');
    
    // Por defecto expandido es false, no se debe ver la razon IA
    expect(componente.expandido).toBeFalse();
    expect(html).not.toContain('Análisis de últimas 10 compras');
  });

  it('dado que se clickea toggleDetalle, debe alternar expandido y mostrar la razonIA', () => {
    // Simulamos primer click
    componente.toggleDetalle();
    fixture.detectChanges();

    expect(componente.expandido).toBeTrue();
    const htmlExp = fixture.nativeElement.innerHTML;
    expect(htmlExp).toContain('Análisis de últimas 10 compras');
    expect(htmlExp).toContain('Ocultar detalle'); // el texto del boton cambia

    // Simulamos segundo click
    componente.toggleDetalle();
    fixture.detectChanges();

    expect(componente.expandido).toBeFalse();
    expect(fixture.nativeElement.innerHTML).not.toContain('Análisis de últimas 10 compras');
  });
});
