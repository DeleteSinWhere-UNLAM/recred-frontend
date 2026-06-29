import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { BilleteraPage } from './billetera.page';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { environment } from '../../../environments/environment';
import {
  BilleteraResumen,
  DireccionMovimiento,
  MovimientoBilletera,
} from './models/billetera.model';

interface AlumnoMinimal {
  id: string;
  nombre: string;
  apellido: string;
  grado: string;
  colegioId: string;
  saldo: number;
  urlFotoPerfil?: string;
}

describe('Billetera (integration: page + presenter + service)', () => {
  let httpMock: HttpTestingController;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let alumnoContexto: { alumnoId: ReturnType<typeof signal<string>> };
  let fixture: ComponentFixture<BilleteraPage>;

  const ALUMNO_ID = 'alumno-1';
  const API = environment.apiUrl.replace(/\/$/, '');
  const URL_RESUMEN = `${API}/wallets/students/${ALUMNO_ID}/summary`;

  function aIsoDate(fecha: Date): string {
    const a = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${a}-${m}-${d}`;
  }

  const HOY = aIsoDate(new Date());
  const PRIMER_DIA_MES = aIsoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  afterEach(() => {
    httpMock.verify();
  });

  describe('dado un alumno como vista alumno y un resumen del backend', () => {
    beforeEach(async () => {
      await givenUnEscenarioCon({ alumnoId: ALUMNO_ID, esVistaAlumno: true });
    });

    it('cuando se monta la pagina, deberia llamar al backend con el rango del mes y renderizar saldo y movimientos en el DOM', fakeAsync(() => {
      const resumen = ResumenBilleteraMother.create({
        saldoActual: 5000,
        montoGastado: 800,
        cantidadCompras: 1,
        movimientos: [
          MovimientoMother.create({ id: 'm-1', descripcion: 'Kiosco', monto: 800, direccion: 'SALIDA' }),
        ],
      });

      whenMontoLaPagina();
      flushAsegurarCargados();
      thenElServiceHizoGetConRango(PRIMER_DIA_MES, HOY, resumen);
      detectChanges();

      thenElDomMuestraSaldo('5.000');
      thenElDomMuestraMovimientoConDescripcion('Kiosco');
    }));

    it('cuando hago clic en el chip "Hoy", deberia disparar un nuevo GET con desde=hoy y refrescar el DOM con el nuevo resumen', fakeAsync(() => {
      const resumenMes = ResumenBilleteraMother.create({ saldoActual: 5000 });
      const resumenHoy = ResumenBilleteraMother.create({
        saldoActual: 5000,
        cantidadCompras: 3,
        movimientos: [MovimientoMother.create({ id: 'h-1', descripcion: 'Recreo', monto: 200 })],
      });

      whenMontoLaPagina();
      flushAsegurarCargados();
      thenElServiceHizoGetConRango(PRIMER_DIA_MES, HOY, resumenMes);
      detectChanges();

      whenClickEnChipConTexto('Hoy');
      thenElServiceHizoGetConRango(HOY, HOY, resumenHoy);
      detectChanges();

      thenElDomMuestraMovimientoConDescripcion('Recreo');
    }));
  });

  describe('dado que el backend devuelve un error', () => {
    beforeEach(async () => {
      await givenUnEscenarioCon({ alumnoId: ALUMNO_ID, esVistaAlumno: true });
    });

    it('cuando el GET de resumen falla con 500, deberia mostrar el mensaje de error en el DOM', fakeAsync(() => {
      whenMontoLaPagina();
      flushAsegurarCargados();

      const req = httpMock.expectOne((r) => r.url === URL_RESUMEN);
      req.flush('boom', { status: 500, statusText: 'Server Error' });
      detectChanges();

      thenElDomContieneTexto('No se pudo cargar la billetera');
    }));
  });

  const ResumenBilleteraMother = {
    create(overrides: Partial<BilleteraResumen> = {}): BilleteraResumen {
      return {
        alumnoId: ALUMNO_ID,
        saldoActual: 0,
        periodo: { desde: '2026-06-01', hasta: '2026-06-15' },
        montoIngresado: 0,
        montoGastado: 0,
        balancePeriodo: 0,
        cantidadCompras: 0,
        gastoPorCategoria: [],
        gastoPorClasificacionSalud: [],
        movimientos: [],
        ...overrides,
      };
    },
  };

  const MovimientoMother = {
    create(overrides: Partial<MovimientoBilletera> = {}): MovimientoBilletera {
      return {
        id: 'mov-1',
        fechaHora: '2026-06-10T12:00:00',
        tipo: 'COMPRA',
        descripcion: 'Compra',
        monto: 100,
        direccion: 'SALIDA' as DireccionMovimiento,
        ...overrides,
      };
    },
  };

  const AlumnoMother = {
    create(overrides: Partial<AlumnoMinimal> = {}): AlumnoMinimal {
      return {
        id: ALUMNO_ID,
        nombre: 'Julián',
        apellido: 'García',
        grado: '5° A',
        colegioId: 'col-1',
        saldo: 5000,
        urlFotoPerfil: 'foto.jpg',
        ...overrides,
      };
    },
  };

  async function givenUnEscenarioCon(opciones: {
    alumnoId: string;
    esVistaAlumno: boolean;
  }): Promise<void> {
    alumnoContexto = { alumnoId: signal(opciones.alumnoId) };

    alumnosServiceSpy = jasmine.createSpyObj<AlumnosService>('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
    ]);
    alumnosServiceSpy.asegurarCargados.and.resolveTo();
    alumnosServiceSpy.getAlumnoById.and.returnValue(AlumnoMother.create());

    perfilServiceSpy = jasmine.createSpyObj<PerfilService>('PerfilService', [
      'rol',
      'obtenerAlumnoId',
    ]);
    perfilServiceSpy.rol.and.returnValue(opciones.esVistaAlumno ? 'ALUMNO' : 'PADRE');
    perfilServiceSpy.obtenerAlumnoId.and.returnValue(null);

    usuarioServiceSpy = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'setHomeUrl',
      'getAlumnoActual',
    ]);
    Object.assign(usuarioServiceSpy, {
      esVistaAlumno: signal(opciones.esVistaAlumno),
      esVistaKiosquero: signal(false),
      nombreNavbar: signal('Julián'),
    });
    usuarioServiceSpy.getAlumnoActual.and.returnValue(AlumnoMother.create());

    await TestBed.configureTestingModule({
      imports: [BilleteraPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: () => null }),
            snapshot: { paramMap: { get: () => null } },
          },
        },
        { provide: AlumnoContextoService, useValue: alumnoContexto },
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: AlumnosService, useValue: alumnosServiceSpy },
      ],
    })
      .overrideComponent(BilleteraPage, {
        remove: { imports: [NavbarComponent] },
        add: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  }

  function whenMontoLaPagina(): void {
    fixture = TestBed.createComponent(BilleteraPage);
    fixture.detectChanges();
  }

  function flushAsegurarCargados(): void {
    tick();
    fixture.detectChanges();
  }

  function detectChanges(): void {
    fixture.detectChanges();
  }

  function whenClickEnChipConTexto(texto: string): void {
    const root = fixture.nativeElement as HTMLElement;
    const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('.billetera__chip'));
    const chip = chips.find((b) => b.textContent?.trim() === texto);
    if (!chip) throw new Error(`No se encontró el chip "${texto}"`);
    chip.click();
    fixture.detectChanges();
  }

  function thenElServiceHizoGetConRango(
    desde: string,
    hasta: string,
    resumen: BilleteraResumen,
  ): void {
    const req: TestRequest = httpMock.expectOne(
      (r) =>
        r.url === URL_RESUMEN &&
        r.params.get('desde') === desde &&
        r.params.get('hasta') === hasta,
    );
    expect(req.request.method).toBe('GET');
    req.flush(resumen);
  }

  function thenElDomMuestraSaldo(montoEsperado: string): void {
    const root = fixture.nativeElement as HTMLElement;
    const saldo = root.querySelector('.billetera__saldo-monto');
    expect(saldo?.textContent?.trim()).toContain(montoEsperado);
  }

  function thenElDomMuestraMovimientoConDescripcion(descripcion: string): void {
    const root = fixture.nativeElement as HTMLElement;
    const items = Array.from(root.querySelectorAll<HTMLElement>('.billetera__movimiento-descripcion'));
    const matches = items.some((el) => el.textContent?.includes(descripcion));
    expect(matches).toBeTrue();
  }

  function thenElDomContieneTexto(texto: string): void {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(texto);
  }
});
