import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferenciaCardComponent } from './preferencia-card.component';

describe('PreferenciaCardComponent', () => {
  let component: PreferenciaCardComponent;
  let fixture: ComponentFixture<PreferenciaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreferenciaCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PreferenciaCardComponent);
    component = fixture.componentInstance;
  });

  it('debería renderizar los datos de la preferencia', () => {
    const preferencia = {
      titulo: 'Test Titulo',
      mensaje: 'Test Mensaje',
      productoId: '123',
      razonIA: 'Test Razon'
    };

    givenPreferencia(preferencia);
    whenDetectoCambios();
    thenMuestraLosDatosCorrectamente();
  });

  function givenPreferencia(preferencia: any): void {
    component.preferencia = preferencia;
  }

  function whenDetectoCambios(): void {
    fixture.detectChanges();
  }

  function thenMuestraLosDatosCorrectamente(): void {
    const cardText = fixture.nativeElement.textContent;
    expect(cardText).toContain('Test Titulo');
    expect(cardText).toContain('Test Mensaje');
    expect(cardText).toContain('Test Razon');
  }
});
