import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Component, Input, signal } from '@angular/core';
import { RestriccionesNutricionalesPage } from './restricciones-nutricionales.page';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { RestriccionesNutricionalesPresenter } from './presenter/restricciones-nutricionales.presenter';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
class MockNavbarComponent {
  @Input() userName = '';
}

describe('RestriccionesNutricionalesPage', () => {
  let componente: RestriccionesNutricionalesPage;
  let fixture: ComponentFixture<RestriccionesNutricionalesPage>;

  let mockUsuarioService: jasmine.SpyObj<UsuarioService>;
  let mockPresenter: jasmine.SpyObj<RestriccionesNutricionalesPresenter>;

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: jasmine.createSpy('get').and.returnValue('alum-123')
      }
    }
  };

  beforeEach(async () => {
    mockUsuarioService = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual']);
    mockPresenter = jasmine.createSpyObj('RestriccionesNutricionalesPresenter', ['init', 'guardar']);
    
    Object.defineProperty(mockPresenter, 'alumno', { value: signal(undefined) });
    Object.defineProperty(mockPresenter, 'restricciones', { value: signal({}) });
    Object.defineProperty(mockPresenter, 'horariosCompra', { value: signal([]) });
    Object.defineProperty(mockPresenter, 'cargando', { value: signal(false) });
    Object.defineProperty(mockPresenter, 'guardando', { value: signal(false) });
    Object.defineProperty(mockPresenter, 'nombreCompleto', { value: signal('Juan Pérez') });
    Object.defineProperty(mockPresenter, 'urlFotoPerfil', { value: signal(null) });
    Object.defineProperty(mockPresenter, 'grado', { value: signal('1A') });
    Object.defineProperty(mockPresenter, 'iniciales', { value: signal('JP') });
    Object.defineProperty(mockPresenter, 'catalogo', { value: [] });

    mockUsuarioService.getUsuarioActual.and.returnValue({ nombre: 'Tutor Carlos' } as any);

    await TestBed.configureTestingModule({
      imports: [RestriccionesNutricionalesPage],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: UsuarioService, useValue: mockUsuarioService }
      ]
    })
    .overrideComponent(RestriccionesNutricionalesPage, {
      remove: {
        imports: [NavbarComponent],
        providers: [RestriccionesNutricionalesPresenter]
      },
      add: {
        imports: [MockNavbarComponent],
        providers: [{ provide: RestriccionesNutricionalesPresenter, useValue: mockPresenter }]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestriccionesNutricionalesPage);
    componente = fixture.componentInstance;
  });

  it('dado que se inicializa, debe asignar el nombre de usuario', () => {
    // Esto se ejecuta inmediatamente antes del ngOnInit por la asignacion readonly en clase
    expect(componente.nombreUsuario).toBe('Tutor Carlos');
  });

  it('dado que tiene alumnoId en la URL, ngOnInit debe llamar al init del presenter con ese ID', () => {
    mockActivatedRoute.snapshot.paramMap.get.and.returnValue('alum-123');
    
    fixture.detectChanges(); // Ejecuta ngOnInit

    expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('alumnoId');
    expect(mockPresenter.init).toHaveBeenCalledWith('alum-123');
  });

  it('dado que la URL NO tiene alumnoId, ngOnInit debe llamar al init del presenter con string vacío', () => {
    mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);
    
    // Necesitamos recrear el componente porque ngOnInit solo corre una vez
    fixture = TestBed.createComponent(RestriccionesNutricionalesPage);
    componente = fixture.componentInstance;
    
    fixture.detectChanges();

    expect(mockPresenter.init).toHaveBeenCalledWith('');
  });
});
