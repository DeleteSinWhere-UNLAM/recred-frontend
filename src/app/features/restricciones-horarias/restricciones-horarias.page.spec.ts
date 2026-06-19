import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RestriccionesHorariasPage } from './restricciones-horarias.page';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { RestriccionesHorariasPresenter } from './presenter/restricciones-horarias.presenter';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('RestriccionesHorariasPage', () => {
  let component: RestriccionesHorariasPage;
  let fixture: ComponentFixture<RestriccionesHorariasPage>;
  let presenterMock: unknown;
  let locationMock: unknown;
  let activatedRouteMock: unknown;

  beforeEach(async () => {
    presenterMock = jasmine.createSpyObj('RestriccionesHorariasPresenter', [
      'init', 'agregarRestriccion', 'quitarRestriccion', 'getNombreCategoria', 'getNombreSalud'
    ]);
    
    // Mocks return values via signals to simulate Presenter state
    presenterMock.getNombreCategoria.and.returnValue('Categoria Mock');
    presenterMock.getNombreSalud.and.returnValue('Salud Mock');
    presenterMock.alumno = signal({ id: 'a1', nombre: 'Test' });
    presenterMock.cargando = signal(false);
    presenterMock.franjasConRestricciones = signal([
      { 
        franja: { id: 'ts1' }, 
        restricciones: [
          { id: 'r1', categoryId: 'cat1' }
        ],
        categoriasDisponibles: [],
        saludDisponible: [],
        tieneBloqueoTotal: false
      }
    ]);
    presenterMock.categorias = signal([
      { id: 'cat1', descripcion: 'Bebidas azucaradas' }
    ]);
    presenterMock.catalogoSaludDisponible = signal([
      { id: 'sal1', descripcion: 'Sin TACC' }
    ]);

    locationMock = jasmine.createSpyObj('Location', ['back']);
    activatedRouteMock = {
      snapshot: { paramMap: { get: () => 'a1' } }
    };

    await TestBed.configureTestingModule({
      imports: [RestriccionesHorariasPage],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: Location, useValue: locationMock },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).overrideProvider(RestriccionesHorariasPresenter, { useValue: presenterMock }).compileComponents();

    fixture = TestBed.createComponent(RestriccionesHorariasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('dado que inicializa, deberia llamar a init del presenter', () => {
    expect(presenterMock.init).toHaveBeenCalledWith('a1');
    expect(component['selectedFranjaId']()).toBe('ts1');
  });

  it('dado que llamo a volver, deberia llamar a location.back', () => {
    component.volver();
    expect(locationMock.back).toHaveBeenCalled();
  });

  it('dado que consulto quickToggles, deberia generar los toggles correctos', () => {
    const toggles = component['quickToggles']();
    // Tenemos una bebida (Bebidas azucaradas) y un tacc (Sin TACC)
    expect(toggles.length).toBe(2);
    expect(toggles[0].titulo).toBe('Bebidas');
    expect(toggles[0].checked).toBeTrue();
    expect(toggles[1].titulo).toBe('Gluten / TACC');
    expect(toggles[1].checked).toBeFalse();
  });

  it('dado que llamo a alternarToggle chequeado, deberia quitar restriccion', () => {
    const toggle = component['quickToggles']()[0];
    component['alternarToggle'](toggle);
    expect(presenterMock.quitarRestriccion).toHaveBeenCalledWith('r1');
  });

  it('dado que llamo a alternarToggle no chequeado, deberia agregar restriccion', () => {
    const toggle = component['quickToggles']()[1];
    component['alternarToggle'](toggle);
    expect(presenterMock.agregarRestriccion).toHaveBeenCalledWith('ts1', 'SALUD', 'sal1');
  });

  it('dado que llamo a agregar con TOTAL, deberia agregar restriccion TOTAL', () => {
    component.agregar('ts1', 'ALL:all');
    expect(presenterMock.agregarRestriccion).toHaveBeenCalledWith('ts1', 'TOTAL');
  });

  it('dado que llamo a agregar con CAT, deberia agregar restriccion CATEGORIA', () => {
    component.agregar('ts1', 'CAT:cat2');
    expect(presenterMock.agregarRestriccion).toHaveBeenCalledWith('ts1', 'CATEGORIA', 'cat2');
  });

  it('dado que llamo a quitarBloqueoTotal, deberia buscar y quitar la restriccion sin IDs', () => {
    const item = {
      franja: { id: 'ts1' } as unknown,
      restricciones: [{ id: 'rtotal' } as unknown],
      categoriasDisponibles: [], saludDisponible: [], tieneBloqueoTotal: true
    };
    component['quitarBloqueoTotal'](item);
    expect(presenterMock.quitarRestriccion).toHaveBeenCalledWith('rtotal');
  });
});
