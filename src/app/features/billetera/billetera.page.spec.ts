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
      desde: signal('2024-01-01'),
      hasta: signal('2024-01-31'),
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

  it('dado que se inicializa el componente con rol ALUMNO, deberia configurar homeUrl en /alumno y llamar init', () => {
    expect(component).toBeTruthy();
    expect(usuarioServiceSpy.setHomeUrl).toHaveBeenCalledWith('/alumno');
    expect(mockPresenter.init).toHaveBeenCalledWith('alumno-1');
  });

  it('dado que se invoca cambiarFecha, deberia delegar al presenter', () => {
    // casteamos a any para acceder a la funcion protegida (sin usar "any" explícito como tipo de variable local, sólo en la invocación o usando string notation)
    (component as unknown as { cambiarFecha: (v: string) => void }).cambiarFecha('mes');
    expect(mockPresenter.cambiarFecha).toHaveBeenCalledWith('mes' as any);
  });

  it('dado que cambia la fecha desde, deberia delegar a setearRango con el nuevo valor', () => {
    const mockEvent = { target: { value: '2024-02-01' } } as unknown as Event;
    (component as unknown as { onDesdeChange: (e: Event) => void }).onDesdeChange(mockEvent);
    expect(mockPresenter.setearRango).toHaveBeenCalledWith('2024-02-01', '2024-01-31');
  });

  it('dado que cambia la fecha hasta, deberia delegar a setearRango con el nuevo valor', () => {
    const mockEvent = { target: { value: '2024-02-28' } } as unknown as Event;
    (component as unknown as { onHastaChange: (e: Event) => void }).onHastaChange(mockEvent);
    expect(mockPresenter.setearRango).toHaveBeenCalledWith('2024-01-01', '2024-02-28');
  });
});

describe('BilleteraPage - Otros roles', () => {
  let mockPresenter: jasmine.SpyObj<BilleteraPresenter>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    mockPresenter = jasmine.createSpyObj('BilleteraPresenter', ['init']);
    Object.assign(mockPresenter, {
      cargando: signal(false),
      error: signal(null),
      esVistaAlumno: signal(true),
      nombreAlumno: signal(''),
      iniciales: signal(''),
      urlFotoPerfil: signal(null),
      saldoNegativo: signal(false),
      desde: signal('2024-01-01'),
      hasta: signal('2024-01-31'),
      saldoActualFormateado: signal('$ 0'),
      periodoLabel: signal(''),
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
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['setHomeUrl']);
    Object.assign(usuarioServiceSpy, { esVistaAlumno: signal(true) });

    await TestBed.configureTestingModule({
      imports: [BilleteraPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of({ get: () => null }) }
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
  });

  it('dado rol PADRE, deberia configurar homeUrl en /tutor y procesar id null', () => {
    perfilServiceSpy.rol.and.returnValue('PADRE');
    const fixture = TestBed.createComponent(BilleteraPage);
    fixture.detectChanges();
    
    expect(usuarioServiceSpy.setHomeUrl).toHaveBeenCalledWith('/tutor');
    expect(mockPresenter.init).toHaveBeenCalledWith(null);
  });

  it('dado otro rol (ADMIN), no deberia configurar homeUrl', () => {
    perfilServiceSpy.rol.and.returnValue('VENDEDOR');
    const fixture = TestBed.createComponent(BilleteraPage);
    fixture.detectChanges();
    
    expect(usuarioServiceSpy.setHomeUrl).not.toHaveBeenCalled();
  });
});

