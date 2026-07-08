import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PuntosRecompensaBarComponent } from './puntos-recompensa-bar.component';
import { Router } from '@angular/router';
import { StudentRewardStatus } from '../../../../data-access/models/student-reward-status.model';
import { By } from '@angular/platform-browser';

describe('PuntosRecompensaBarComponent', () => {
  let component: PuntosRecompensaBarComponent;
  let fixture: ComponentFixture<PuntosRecompensaBarComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [PuntosRecompensaBarComponent],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PuntosRecompensaBarComponent);
    component = fixture.componentInstance;
  });

  it('dado que se crea el componente, debería inicializarse correctamente', () => {
    givenStatus(StudentRewardStatusMother.principiante());
    
    whenDetectoCambios();
    
    expect(component).toBeTruthy();
  });

  describe('Navegación al hacer click', () => {
    it('dado un click en la barra, cuando se ejecuta el evento, debería navegar a la explicación de puntos', () => {
      givenStatus(StudentRewardStatusMother.crack());
      whenDetectoCambios();

      whenHagoClickEnLaBarra();

      thenDeberiaNavegarAExplicacionPuntos();
    });
  });

  describe('Visualización de datos', () => {
    it('dado un estado PRINCIPIANTE, cuando se renderiza, debería mostrar el puntaje y nivel correcto', () => {
      givenStatus(StudentRewardStatusMother.principiante());
      
      whenDetectoCambios();

      thenDeberiaMostrarNivel('PRINCIPIANTE');
      thenDeberiaMostrarPuntos('50 pts');
    });

    it('dado un estado GOAT sin proximo nivel, cuando se renderiza, no debería mostrar puntos faltantes', () => {
      givenStatus(StudentRewardStatusMother.goat());
      
      whenDetectoCambios();

      thenNoDeberiaMostrarPuntosFaltantes();
    });
  });

  // --- Mothers & Helpers ---

  const StudentRewardStatusMother = {
    create(overrides: Partial<StudentRewardStatus> = {}): StudentRewardStatus {
      return {
        puntajeTotal: 0,
        nivelGlobal: 'PRINCIPIANTE',
        mensajeMotivacional: '¡Ánimo!',
        puntosFaltantes: 100,
        proximoNivel: 'CRACK',
        porcentajeProgreso: 0,
        ...overrides
      };
    },
    principiante(): StudentRewardStatus {
      return this.create({
        puntajeTotal: 50,
        nivelGlobal: 'PRINCIPIANTE',
        mensajeMotivacional: 'Sigue así',
        puntosFaltantes: 50,
        proximoNivel: 'CRACK',
        porcentajeProgreso: 50
      });
    },
    crack(): StudentRewardStatus {
      return this.create({
        puntajeTotal: 150,
        nivelGlobal: 'CRACK',
        mensajeMotivacional: '¡Sos crack!',
        puntosFaltantes: 100,
        proximoNivel: 'GOAT',
        porcentajeProgreso: 33
      });
    },
    goat(): StudentRewardStatus {
      return this.create({
        puntajeTotal: 300,
        nivelGlobal: 'GOAT',
        mensajeMotivacional: '¡Estás en la cima!',
        puntosFaltantes: 0,
        proximoNivel: null,
        porcentajeProgreso: 100
      });
    }
  };

  function givenStatus(status: StudentRewardStatus): void {
    component.status = status;
  }

  function whenDetectoCambios(): void {
    fixture.detectChanges();
  }

  function whenHagoClickEnLaBarra(): void {
    const barra = fixture.debugElement.query(By.css('.recompensas-bar'));
    barra.triggerEventHandler('click', null);
  }

  function thenDeberiaNavegarAExplicacionPuntos(): void {
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/puntos']);
  }

  function thenDeberiaMostrarNivel(nivel: string): void {
    const badge = fixture.debugElement.query(By.css('.nivel-badge')).nativeElement;
    expect(badge.textContent.trim()).toBe(nivel);
  }

  function thenDeberiaMostrarPuntos(puntosTexto: string): void {
    const puntos = fixture.debugElement.query(By.css('.puntos-actuales')).nativeElement;
    expect(puntos.textContent.trim()).toBe(puntosTexto);
  }

  function thenNoDeberiaMostrarPuntosFaltantes(): void {
    const faltantes = fixture.debugElement.query(By.css('.faltan-puntos'));
    expect(faltantes).toBeNull();
  }
});
