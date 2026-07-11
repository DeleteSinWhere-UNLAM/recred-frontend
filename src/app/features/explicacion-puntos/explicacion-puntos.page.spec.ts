import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExplicacionPuntosPage } from './explicacion-puntos.page';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';

describe('ExplicacionPuntosPage', () => {
  let component: ExplicacionPuntosPage;
  let fixture: ComponentFixture<ExplicacionPuntosPage>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExplicacionPuntosPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExplicacionPuntosPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
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


  function whenHagoClickEnBotonVolver(): void {
    const btn = fixture.debugElement.query(By.css('.btn-volver'));
    btn.triggerEventHandler('click', null);
  }



  function thenDeberiaNavegarAlHomeAlumno(): void {
    expect(router.navigate).toHaveBeenCalledWith(['/alumno']);
  }
});
