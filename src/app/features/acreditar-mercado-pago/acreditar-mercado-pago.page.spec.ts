import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { AcreditarMercadoPagoPage } from './acreditar-mercado-pago.page';
import { AcreditarMercadoPagoPresenter } from './presenter/acreditar-mercado-pago.presenter';
import { NO_ERRORS_SCHEMA, signal, WritableSignal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';

describe('AcreditarMercadoPagoPage', () => {
  let component: AcreditarMercadoPagoPage;
  let fixture: ComponentFixture<AcreditarMercadoPagoPage>;
  let mockPresenter: jasmine.SpyObj<AcreditarMercadoPagoPresenter>;
  let mockContextoService: jasmine.SpyObj<AlumnoContextoService>;

  beforeEach(async () => {
    mockPresenter = jasmine.createSpyObj('AcreditarMercadoPagoPresenter', ['init', 'acreditar', 'volver']);
    mockPresenter.init.and.returnValue(Promise.resolve(undefined));
    mockPresenter.acreditar.and.returnValue(Promise.resolve(undefined));

    Object.assign(mockPresenter, {
      cargando: signal(false),
      alumno: signal(undefined),
      nombreCompleto: signal(''),
      grado: signal(''),
      iniciales: signal(''),
      urlFotoPerfil: signal(null),
      historialRecargas: signal([])
    });

    mockContextoService = jasmine.createSpyObj('AlumnoContextoService', ['setAlumnoId', 'limpiar']);
    Object.defineProperty(mockContextoService, 'alumnoId', {
      value: signal('123'),
      writable: true,
    });

    await TestBed.configureTestingModule({
      imports: [AcreditarMercadoPagoPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({
              get: (key: string) => key === 'alumnoId' ? '123' : null
            }),
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'alumnoId' ? '123' : null
              }
            }
          }
        },
        { provide: AlumnoContextoService, useValue: mockContextoService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .overrideComponent(AcreditarMercadoPagoPage, {
      set: {
        providers: [
          { provide: AcreditarMercadoPagoPresenter, useValue: mockPresenter }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcreditarMercadoPagoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Dado que se inicializa el componente, debería llamar al presenter.init con el id del alumno', () => {
    expect(mockPresenter.init).toHaveBeenCalledWith('123');
  });

  it('Dado que el paramMap no tiene alumnoId, debería llamar al presenter.init con un string vacío', () => {
    TestBed.resetTestingModule();
    (mockContextoService.alumnoId as unknown as WritableSignal<string>).set('');
    TestBed.configureTestingModule({
      imports: [AcreditarMercadoPagoPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({
              get: () => null
            }),
            snapshot: {
              paramMap: {
                get: () => null
              }
            }
          }
        },
        { provide: AlumnoContextoService, useValue: mockContextoService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .overrideComponent(AcreditarMercadoPagoPage, {
      set: {
        providers: [
          { provide: AcreditarMercadoPagoPresenter, useValue: mockPresenter }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }
    })
    .compileComponents();

    const newFixture = TestBed.createComponent(AcreditarMercadoPagoPage);
    newFixture.detectChanges();
    expect(mockPresenter.init).toHaveBeenCalledWith('');
  });

  it('Dado que cambia el monto en el input, debería actualizar la variable montoIngresado', () => {
    const event = { target: { value: '500' } } as unknown as Event;
    component['onMontoChange'](event);
    expect(component.montoIngresado).toBe(500);
  });

  it('Dado que se hace submit en el formulario, debería prevenir el comportamiento por defecto y llamar a presenter.acreditar', () => {
    const event = new Event('submit');
    spyOn(event, 'preventDefault');
    component.montoIngresado = 1000;
    component['onSubmit'](event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockPresenter.acreditar).toHaveBeenCalledWith(1000);
  });
});
