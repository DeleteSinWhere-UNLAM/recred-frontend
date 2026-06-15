import { Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { BilleteraPresenter } from './billetera.presenter';
import { BilleteraService } from '../services/billetera.service';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { BilleteraResumen } from '../models/billetera.model';

describe('BilleteraPresenter', () => {
  let presenter: BilleteraPresenter;
  let billeteraServiceSpy: jasmine.SpyObj<BilleteraService>;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const resumenMock: BilleteraResumen = {
    alumnoId: 'alumno-1',
    saldoActual: 1250,
    periodo: { desde: '2026-06-01', hasta: '2026-06-14' },
    montoIngresado: 3000,
    montoGastado: 1750,
    balancePeriodo: 1250,
    cantidadCompras: 8,
    gastoPorCategoria: [
      { categoria: 'Golosinas', monto: 600, porcentaje: 34.28 },
    ],
    gastoPorClasificacionSalud: [
      { clasificacion: 'Saludable', monto: 900, porcentaje: 51.43 },
    ],
    movimientos: [
      {
        id: 'mov-1',
        fechaHora: '2026-06-14T10:15:00',
        tipo: 'COMPRA',
        descripcion: 'Compra en buffet',
        monto: 450,
        direccion: 'SALIDA',
      },
    ],
  };

  beforeEach(() => {
    billeteraServiceSpy = jasmine.createSpyObj('BilleteraService', ['getResumen']);
    billeteraServiceSpy.getResumen.and.returnValue(of(resumenMock));

    alumnosServiceSpy = jasmine.createSpyObj('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
    ]);
    alumnosServiceSpy.asegurarCargados.and.resolveTo([]);
    alumnosServiceSpy.getAlumnoById.and.returnValue({
      id: 'alumno-1',
      nombre: 'Julián',
      apellido: 'García',
      grado: '4to',
      colegioId: 'col-1',
      saldo: 1250,
    });

    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['obtenerAlumnoId']);
    perfilServiceSpy.obtenerAlumnoId.and.returnValue(null);

    const esVistaAlumnoStub = (() => true) as unknown as Signal<boolean>;
    usuarioServiceSpy = jasmine.createSpyObj(
      'UsuarioService',
      ['getAlumnoActual'],
      { esVistaAlumno: esVistaAlumnoStub },
    );
    usuarioServiceSpy.getAlumnoActual.and.returnValue({
      id: 'alumno-1',
      nombre: 'Julián',
      apellido: 'García',
      grado: '4to',
      colegioId: 'col-1',
      saldo: 1250,
    });

    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        BilleteraPresenter,
        { provide: BilleteraService, useValue: billeteraServiceSpy },
        { provide: AlumnosService, useValue: alumnosServiceSpy },
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    presenter = TestBed.inject(BilleteraPresenter);
  });

  it('debería crearse', () => {
    expect(presenter).toBeTruthy();
  });

  it('init debería resolver alumnoId desde la ruta y cargar resumen', async () => {
    presenter.init('alumno-1');
    await new Promise((r) => setTimeout(r, 0));

    expect(billeteraServiceSpy.getResumen).toHaveBeenCalled();
    const args = billeteraServiceSpy.getResumen.calls.mostRecent().args;
    expect(args[0]).toBe('alumno-1');
    expect(presenter.resumen()).toEqual(resumenMock);
    expect(presenter.cargando()).toBeFalse();
  });

  it('init sin id de ruta debería usar el perfilService', async () => {
    perfilServiceSpy.obtenerAlumnoId.and.returnValue('alumno-1');
    presenter.init(null);
    await new Promise((r) => setTimeout(r, 0));

    expect(billeteraServiceSpy.getResumen).toHaveBeenCalled();
    expect(billeteraServiceSpy.getResumen.calls.mostRecent().args[0]).toBe('alumno-1');
  });

  it('cambiarFecha debería recargar el resumen y actualizar el rango activo', async () => {
    presenter.init('alumno-1');
    await new Promise((r) => setTimeout(r, 0));
    billeteraServiceSpy.getResumen.calls.reset();

    presenter.cambiarFecha('semana');

    expect(billeteraServiceSpy.getResumen).toHaveBeenCalled();
    expect(presenter.rangoFecha()).toBe('semana');
  });

  it('debería formatear montos con signo según dirección', () => {
    expect(
      presenter.formatearMontoConSigno({
        id: 'a',
        fechaHora: '',
        tipo: 'CARGA',
        descripcion: '',
        monto: 3000,
        direccion: 'ENTRADA',
      }),
    ).toContain('+');

    expect(
      presenter.formatearMontoConSigno({
        id: 'b',
        fechaHora: '',
        tipo: 'COMPRA',
        descripcion: '',
        monto: 450,
        direccion: 'SALIDA',
      }),
    ).toContain('-');
  });
});
