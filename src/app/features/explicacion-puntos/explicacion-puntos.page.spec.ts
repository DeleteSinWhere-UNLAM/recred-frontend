import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExplicacionPuntosPage } from './explicacion-puntos.page';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('ExplicacionPuntosPage', () => {
  let component: ExplicacionPuntosPage;
  let fixture: ComponentFixture<ExplicacionPuntosPage>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ExplicacionPuntosPage],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExplicacionPuntosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se crea la página, debería inicializarse correctamente', () => {
    expect(component).toBeTruthy();
  });

  describe('Navegación', () => {
    it('dado un click en el botón de volver, cuando se ejecuta el evento, debería navegar al home de alumno', () => {
      whenHagoClickEnBotonVolver();

      thenDeberiaNavegarAlHomeAlumno();
    });


  });

  // --- Helpers ---

  function whenHagoClickEnBotonVolver(): void {
    const btn = fixture.debugElement.query(By.css('.btn-volver'));
    btn.triggerEventHandler('click', null);
  }



  function thenDeberiaNavegarAlHomeAlumno(): void {
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/alumno']);
  }
});
