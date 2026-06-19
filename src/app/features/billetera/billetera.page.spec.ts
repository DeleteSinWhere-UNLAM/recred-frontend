import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BilleteraPage } from './billetera.page';
import { ActivatedRoute } from '@angular/router';
import { BilleteraPresenter } from './presenter/billetera.presenter';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { of } from 'rxjs';

describe('BilleteraPage', () => {
  let component: BilleteraPage;
  let fixture: ComponentFixture<BilleteraPage>;
  let mockPresenter: jasmine.SpyObj<BilleteraPresenter>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    mockPresenter = jasmine.createSpyObj('BilleteraPresenter', [
      'init', 'cambiarFecha', 'formatearMontoConSigno', 'iconoMovimiento',
      'formatearFechaMovimiento', 'formatearMonto', 'recargar', 'setearRango', 'volver'
    ]);
    Object.assign(mockPresenter, {
      cargando: signal(false),
      alumno: signal(undefined),
      resumen: signal(undefined),
      rangoFecha: signal('semana'),
      nombreAlumno: signal(''),
      grado: signal(''),
      iniciales: signal(''),
      urlFotoPerfil: signal(null),
      saldoNegativo: signal(false),
      desde: signal(''),
      hasta: signal(''),
      saldoActualFormateado: signal('$ 0'),
      periodoLabel: signal(''),
      error: signal(null),
      montoIngresadoFormateado: signal('$ 0'),
      montoGastadoFormateado: signal('$ 0'),
      balancePositivo: signal(true),
      balancePeriodoFormateado: signal('$ 0'),
      cantidadCompras: signal(0),
      hayCategorias: signal(false),
      gastoPorCategoria: signal([]),
      hayClasificacionSalud: signal(false),
      gastoPorClasificacionSalud: signal([]),
      hayMovimientos: signal(false),
      movimientos: signal([])
    });

    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['rol']);
    perfilServiceSpy.rol.and.returnValue('ALUMNO');

    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['setHomeUrl']);
    Object.assign(usuarioServiceSpy, { 
      esVistaAlumno: signal(true),
      esVistaKiosquero: signal(false)
    });

    await TestBed.configureTestingModule({
      imports: [BilleteraPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({
              get: (key: string) => key === 'alumnoId' ? 'alumno-1' : null
            }),
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'alumnoId' ? 'alumno-1' : null
              }
            }
          }
        },
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .overrideComponent(BilleteraPage, {
      set: {
        providers: [
          { provide: BilleteraPresenter, useValue: mockPresenter }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(BilleteraPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa el componente, deberia crearse y llamar a init del presenter', () => {
    expect(component).toBeTruthy();
    expect(mockPresenter.init).toHaveBeenCalledWith('alumno-1');
  });

  it('dado que no hay id en ruta, deberia llamar a init con null', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [BilleteraPage],
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
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .overrideComponent(BilleteraPage, {
      set: {
        providers: [
          { provide: BilleteraPresenter, useValue: mockPresenter }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }
    })
    .compileComponents();

    const newFixture = TestBed.createComponent(BilleteraPage);
    newFixture.detectChanges();
    expect(mockPresenter.init).toHaveBeenCalledWith(null);
  });
});
