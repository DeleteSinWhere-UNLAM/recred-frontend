import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SpendingPredictionPageComponent } from './spending-prediction-page.component';
import { SpendingPredictionService } from '../services/spending-prediction.service';
import { SpendingPrediction } from '../models/spending-prediction.interface';
import { By } from '@angular/platform-browser';

import { Component } from '@angular/core';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-navbar',
  template: '<div>Mock Navbar</div>',
  standalone: true
})
class MockNavbarComponent {}

describe('SpendingPredictionPageComponent', () => {
  let componente: SpendingPredictionPageComponent;
  let fixture: ComponentFixture<SpendingPredictionPageComponent>;
  
  let mockRouter: jasmine.SpyObj<Router>;
  let mockPredictionService: jasmine.SpyObj<SpendingPredictionService>;

  // Creamos el stub con el comportamiento por defecto de ActivatedRoute
  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: jasmine.createSpy('get').and.returnValue('alum-123')
      }
    }
  };

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
    mockPredictionService = jasmine.createSpyObj('SpendingPredictionService', ['getPrediction']);

    await TestBed.configureTestingModule({
      imports: [SpendingPredictionPageComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: SpendingPredictionService, useValue: mockPredictionService }
      ]
    })
    .overrideComponent(SpendingPredictionPageComponent, {
      remove: { imports: [NavbarComponent] },
      add: { imports: [MockNavbarComponent] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpendingPredictionPageComponent);
    componente = fixture.componentInstance;
  });

  it('dado que se inicializa, debe instanciarse', () => {
    mockPredictionService.getPrediction.and.returnValue(of({} as SpendingPrediction));
    fixture.detectChanges();
    expect(componente).toBeTruthy();
  });

  describe('onInit y paramMap', () => {
    it('dado que NO existe alumnoId en ruta, debe mostrar mensaje de error inicial y no llamar servicio', () => {
      // Modificamos el mock para que devuelva nulo
      mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);
      
      fixture.detectChanges(); // Ejecuta ngOnInit

      expect(componente.errorMessage).toContain('No se encontró el alumno');
      expect(mockPredictionService.getPrediction).not.toHaveBeenCalled();
    });
  });

  describe('Flujo de llamadas al servicio', () => {
    beforeEach(() => {
      mockActivatedRoute.snapshot.paramMap.get.and.returnValue('alum-123');
    });

    it('dado que hay un alumnoId, debe llamar al servicio y mostrar el contenido si es exitoso', () => {
      const mockData = { periodo: 'Mayo' } as SpendingPrediction;
      mockPredictionService.getPrediction.and.returnValue(of(mockData));

      fixture.detectChanges();

      expect(mockPredictionService.getPrediction).toHaveBeenCalledWith('alum-123');
      expect(componente.predictionData).toEqual(mockData);
      expect(componente.isLoading).toBeFalse();
      expect(componente.errorMessage).toBeNull();
    });

    it('dado que la llamada al servicio falla, debe manejar el error y permitir reintentar', () => {
      mockPredictionService.getPrediction.and.returnValue(throwError(() => new Error('Network error')));

      fixture.detectChanges();

      expect(componente.isLoading).toBeFalse();
      expect(componente.errorMessage).toContain('No se pudo cargar la predicción');

      // Testeamos la función de reintentar
      const btnReintentar = fixture.debugElement.query(By.css('.prediction-page__reintentar'));
      expect(btnReintentar).not.toBeNull();
      
      // Reseteamos el mock para que ahora sea exitoso
      mockPredictionService.getPrediction.and.returnValue(of({} as SpendingPrediction));
      btnReintentar.nativeElement.click(); // Invoca ngOnInit de nuevo a traves del template

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
