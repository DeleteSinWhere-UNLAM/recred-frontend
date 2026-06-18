import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { AcreditarMercadoPagoPage } from './acreditar-mercado-pago.page';
import { AcreditarMercadoPagoPresenter } from './presenter/acreditar-mercado-pago.presenter';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AcreditarMercadoPagoPage', () => {
  let component: AcreditarMercadoPagoPage;
  let fixture: ComponentFixture<AcreditarMercadoPagoPage>;
  let mockPresenter: jasmine.SpyObj<AcreditarMercadoPagoPresenter>;

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
      urlFotoPerfil: signal(null)
    });

    await TestBed.configureTestingModule({
      imports: [AcreditarMercadoPagoPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'alumnoId' ? '123' : null
              }
            }
          }
        },
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
    TestBed.configureTestingModule({
      imports: [AcreditarMercadoPagoPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => null
              }
            }
          }
        },
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
