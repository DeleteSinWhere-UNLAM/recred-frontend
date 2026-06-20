import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PrediccionGastoPage } from './prediccion-gasto.page';
import { PrediccionGastoService } from './services/prediccion-gasto.service';
import { PrediccionGasto } from './models/prediccion-gasto.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-navbar',
  template: '<div>Mock Navbar</div>',
  standalone: true,
})
class MockNavbarComponent {}

describe('PrediccionGastoPage', () => {
  let componente: PrediccionGastoPage;
  let fixture: ComponentFixture<PrediccionGastoPage>;

  let mockRouter: jasmine.SpyObj<Router>;
  let mockPredictionService: jasmine.SpyObj<PrediccionGastoService>;

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: jasmine.createSpy('get').and.returnValue('alum-123'),
      },
    },
  };

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
    mockPredictionService = jasmine.createSpyObj('PrediccionGastoService', [
      'getPrediction',
    ]);

    await TestBed.configureTestingModule({
      imports: [PrediccionGastoPage],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: PrediccionGastoService, useValue: mockPredictionService },
      ],
    })
      .overrideComponent(PrediccionGastoPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [MockNavbarComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PrediccionGastoPage);
    componente = fixture.componentInstance;
  });

  it('dado que se inicializa, debe instanciarse', () => {
    mockPredictionService.getPrediction.and.returnValue(of({} as PrediccionGasto));
    fixture.detectChanges();
    expect(componente).toBeTruthy();
  });

  describe('onInit y paramMap', () => {
    it('dado que NO existe alumnoId en ruta, debe mostrar mensaje de error inicial y no llamar servicio', () => {
      mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);

      fixture.detectChanges();

      expect(componente.errorMessage).toContain('No se encontró el alumno');
      expect(mockPredictionService.getPrediction).not.toHaveBeenCalled();
    });
  });

  describe('Flujo de llamadas al servicio', () => {
    beforeEach(() => {
      mockActivatedRoute.snapshot.paramMap.get.and.returnValue('alum-123');
    });

    it('dado que hay un alumnoId, debe llamar al servicio y mostrar el contenido si es exitoso', () => {
      const mockData = { periodo: 'Mayo' } as PrediccionGasto;
      mockPredictionService.getPrediction.and.returnValue(of(mockData));

      fixture.detectChanges();

      expect(mockPredictionService.getPrediction).toHaveBeenCalledWith('alum-123');
      expect(componente.predictionData).toEqual(mockData);
      expect(componente.isLoading).toBeFalse();
      expect(componente.errorMessage).toBeNull();
    });

    it('dado que la llamada al servicio falla, debe manejar el error y permitir reintentar', () => {
      mockPredictionService.getPrediction.and.returnValue(
        throwError(() => new Error('Network error')),
      );

      fixture.detectChanges();

      expect(componente.isLoading).toBeFalse();
      expect(componente.errorMessage).toContain('No se pudo cargar la predicción');

      const btnReintentar = fixture.debugElement.query(
        By.css('.prediccion-gasto-page__reintentar'),
      );
      expect(btnReintentar).not.toBeNull();

      mockPredictionService.getPrediction.and.returnValue(of({} as PrediccionGasto));
      btnReintentar.nativeElement.click();

      expect(mockPredictionService.getPrediction).toHaveBeenCalledTimes(2);
    });
  });

  describe('Navegación', () => {
    it('dado que se presiona volver, debe navegar a /tutor', () => {
      componente.volver();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });
  });
});
