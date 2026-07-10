import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { BilleteraPage } from './billetera.page';
import { BilleteraService } from './services/billetera.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { BilleteraResumen } from './models/billetera.model';
import { BilleteraMother } from './billetera.mother';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true,
})
class NavbarStub {
  @Input() userName = '';
}

describe('Billetera Integration', () => {
  let fixture: ComponentFixture<BilleteraPage>;
  let servicioBilletera: jasmine.SpyObj<BilleteraService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    servicioBilletera = jasmine.createSpyObj('BilleteraService', ['getResumen']);
    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['asegurarCargados', 'getAlumnoById']);
    servicioPerfil = jasmine.createSpyObj('PerfilService', ['rol', 'obtenerAlumnoId']);
    servicioUsuario = jasmine.createSpyObj('UsuarioService', [
      'setHomeUrl',
      'getAlumnoActual',
      'esVistaAlumno',
      'nombreNavbar',
    ]);

    servicioAlumnos.asegurarCargados.and.resolveTo();
    servicioAlumnos.getAlumnoById.and.returnValue(
      BilleteraMother.crearAlumno({ nombre: 'Julián', apellido: 'García' }) as never,
    );
    servicioPerfil.rol.and.returnValue('ALUMNO');
    servicioPerfil.obtenerAlumnoId.and.returnValue(null);
    servicioUsuario.getAlumnoActual.and.returnValue(BilleteraMother.crearAlumno() as never);
    servicioUsuario.esVistaAlumno.and.returnValue(true);
    servicioUsuario.nombreNavbar.and.returnValue('Julián');

    await TestBed.configureTestingModule({
      imports: [BilleteraPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: () => null }),
            snapshot: { paramMap: { get: () => null } },
          },
        },
        { provide: BilleteraService, useValue: servicioBilletera },
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: UsuarioService, useValue: servicioUsuario },
        {
          provide: AlumnoContextoService,
          useValue: { alumnoId: signal(BilleteraMother.ALUMNO_ID) },
        },
      ],
    })
      .overrideComponent(BilleteraPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();
  });

  it('dado un resumen del backend, cuando se monta la pagina, deberia renderizar el saldo y los movimientos en el DOM', async () => {
    givenElServicioDevuelveResumen(
      BilleteraMother.crearResumen({
        saldoActual: 5000,
        cantidadCompras: 1,
        movimientos: [BilleteraMother.crearMovimiento({ descripcion: 'Kiosco' })],
      }),
    );

    await whenMontoLaPagina();

    thenElDomMuestraSaldo('5.000');
    thenElDomMuestraMovimientoConDescripcion('Kiosco');
  });

  it('dado el resumen del mes, cuando hago clic en el chip "Hoy", deberia disparar un nuevo getResumen y refrescar el DOM', async () => {
    givenElServicioDevuelveResumenesEnSecuencia(
      BilleteraMother.crearResumen({ saldoActual: 5000 }),
      BilleteraMother.crearResumen({
        saldoActual: 5000,
        movimientos: [BilleteraMother.crearMovimiento({ descripcion: 'Recreo' })],
      }),
    );

    await whenMontoLaPagina();
    whenHagoClickEnChip('Hoy');

    thenSeLlamoAGetResumen(2);
    thenElDomMuestraMovimientoConDescripcion('Recreo');
  });

  it('dado que el servicio falla, cuando se monta la pagina, deberia mostrar el mensaje de error en el DOM', async () => {
    givenElServicioFalla();

    await whenMontoLaPagina();

    thenElDomContieneTexto('No se pudo cargar la billetera');
  });

  function givenElServicioDevuelveResumen(resumen: BilleteraResumen): void {
    servicioBilletera.getResumen.and.returnValue(of(resumen));
  }

  function givenElServicioDevuelveResumenesEnSecuencia(...resumenes: BilleteraResumen[]): void {
    servicioBilletera.getResumen.and.returnValues(...resumenes.map((r) => of(r)));
  }

  function givenElServicioFalla(): void {
    servicioBilletera.getResumen.and.returnValue(throwError(() => new Error('API Error al intentar cargar el resumen')).pipe(delay(0)));
  }

  async function whenMontoLaPagina(): Promise<void> {
    fixture = TestBed.createComponent(BilleteraPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function whenHagoClickEnChip(texto: string): void {
    const root = fixture.nativeElement as HTMLElement;
    const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('.billetera__chip'));
    const chip = chips.find((c) => c.textContent?.trim() === texto);
    if (!chip) throw new Error(`No se encontró el chip "${texto}"`);
    chip.click();
    fixture.detectChanges();
  }

  function thenSeLlamoAGetResumen(cantidad: number): void {
    expect(servicioBilletera.getResumen).toHaveBeenCalledTimes(cantidad);
  }

  function thenElDomMuestraSaldo(montoEsperado: string): void {
    const root = fixture.nativeElement as HTMLElement;
    const saldo = root.querySelector('.billetera__saldo-monto');
    expect(saldo?.textContent?.trim()).toContain(montoEsperado);
  }

  function thenElDomMuestraMovimientoConDescripcion(descripcion: string): void {
    const root = fixture.nativeElement as HTMLElement;
    const items = Array.from(root.querySelectorAll<HTMLElement>('.billetera__movimiento-descripcion'));
    expect(items.some((el) => el.textContent?.includes(descripcion))).toBeTrue();
  }

  function thenElDomContieneTexto(texto: string): void {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(texto);
  }
});
