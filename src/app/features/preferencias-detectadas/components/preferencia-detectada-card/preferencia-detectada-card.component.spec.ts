import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferenciaDetectadaCardComponent } from './preferencia-detectada-card.component';
import { PreferenciaDetectada } from '../../models/preferencia-detectada.model';

class PreferenciaDetectadaCardMother {
  static crearPreferencia(override: Partial<PreferenciaDetectada> = {}): PreferenciaDetectada {
    return {
      sugerenciaId: 'sug-1',
      alumnoId: 'al-1',
      alumnoUserId: 'user-al-1',
      alumnoNombre: 'Juancito',
      tipo: 'COMPRA',
      titulo: 'Le gustan los alfajores',
      mensaje: 'Compra muchos alfajores',
      productoId: 'prod-1',
      razonIA: 'Por frecuencia',
      ...override
    } as unknown as PreferenciaDetectada;
  }
}

describe('PreferenciaDetectadaCardComponent', () => {
  let component: PreferenciaDetectadaCardComponent;
  let fixture: ComponentFixture<PreferenciaDetectadaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreferenciaDetectadaCardComponent]
    }).compileComponents();
  });

  describe('Inicialización y lógica interna', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(PreferenciaDetectadaCardComponent);
      component = fixture.componentInstance;
      component.preferencia = PreferenciaDetectadaCardMother.crearPreferencia();
      fixture.detectChanges();
    });

    it('debería inicializar el componente con la preferencia asignada', () => {
      
      const titulo = component.preferencia.titulo;

      expect(component).toBeTruthy();
      expect(titulo).toBe('Le gustan los alfajores');
    });

    it('debería inicializar con expandido en falso por defecto', () => {
      
      const estadoExpansor = component.expandido;

      expect(estadoExpansor).toBeFalse();
    });

    it('debería alternar el estado de expandido al llamar a toggleDetalle()', () => {
      
      component.toggleDetalle();
      const estadoTrasPrimerToggle = component.expandido;
      
      component.toggleDetalle();
      const estadoTrasSegundoToggle = component.expandido;

      expect(estadoTrasPrimerToggle).toBeTrue();
      expect(estadoTrasSegundoToggle).toBeFalse();
    });
  });
});
