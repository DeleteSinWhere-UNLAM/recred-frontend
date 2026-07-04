import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferenciaDetectadaCardComponent } from './preferencia-detectada-card.component';
import { PreferenciasDetectadasMother } from '../../preferencias-detectadas.mother';



describe('PreferenciaDetectadaCardComponent', () => {
  let component: PreferenciaDetectadaCardComponent;
  let fixture: ComponentFixture<PreferenciaDetectadaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreferenciaDetectadaCardComponent]
    }).compileComponents();
  });

  describe('Inicialización y lógica interna', () => {
    it('debería inicializar el componente con la preferencia asignada', () => {
      givenComponenteCreado();
      whenAsignoPreferencia();
      thenElComponenteSeInicializaCorrectamente();
    });

    it('debería inicializar con expandido en falso por defecto', () => {
      givenComponenteCreado();
      whenAsignoPreferencia();
      thenEstadoExpansorEsFalso();
    });

    it('debería alternar el estado de expandido al llamar a toggleDetalle()', () => {
      givenComponenteCreado();
      whenAsignoPreferencia();
      whenLlamoAToggleDetalle();
      thenEstadoExpansorEsVerdadero();
      whenLlamoAToggleDetalle();
      thenEstadoExpansorEsFalso();
    });
  });

  function givenComponenteCreado(): void {
    fixture = TestBed.createComponent(PreferenciaDetectadaCardComponent);
    component = fixture.componentInstance;
  }

  function whenAsignoPreferencia(): void {
    component.preferencia = PreferenciasDetectadasMother.crearPreferencia();
    fixture.detectChanges();
  }

  function whenLlamoAToggleDetalle(): void {
    component.toggleDetalle();
  }

  function thenElComponenteSeInicializaCorrectamente(): void {
    expect(component).toBeTruthy();
    expect(component.preferencia.titulo).toBe('Le gustan los alfajores');
  }

  function thenEstadoExpansorEsFalso(): void {
    expect(component.expandido).toBeFalse();
  }

  function thenEstadoExpansorEsVerdadero(): void {
    expect(component.expandido).toBeTrue();
  }
});
