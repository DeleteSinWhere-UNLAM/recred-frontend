import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { OrdenCompraMother } from '../../compra.mother';
import { OrdenCompra } from '../../models/orden-compra.model';
import { CompraService } from '../../services/compra.service';
import { ExitoPresenter } from './exito.presenter';

describe('ExitoPresenter', () => {
  let presenter: ExitoPresenter;
  let servicioCompra: jasmine.SpyObj<CompraService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let router: jasmine.SpyObj<Router>;
  let ultimaOrden: WritableSignal<OrdenCompra | null>;

  beforeEach(() => {
    ultimaOrden = signal<OrdenCompra | null>(
      OrdenCompraMother.crearPagada({ codigos: { 'alumno-1': 'ABC123' }, total: 500 }),
    );

    servicioCompra = jasmine.createSpyObj('CompraService', [], {
      ultimaOrden: ultimaOrden.asReadonly(),
    });
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['homeUrl']);
    servicioUsuario.homeUrl.and.returnValue('/tutor');
    router = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);

    TestBed.configureTestingModule({
      providers: [
        ExitoPresenter,
        { provide: CompraService, useValue: servicioCompra },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(ExitoPresenter);
  });

  describe('Estado inicial derivado de la ultima orden', () => {
    it('dado una ultima orden pagada, cuando leo ordenes/total/vacia, deberia reflejar el estado', () => {
      expect(presenter.ordenes().length).toBe(1);
      expect(presenter.total()).toBe(500);
      expect(presenter.vacia()).toBeFalse();
    });

    it('dado sin ultima orden, cuando leo el estado, vacia deberia ser true y ordenes vacio', () => {
      givenSinUltimaOrden();

      expect(presenter.vacia()).toBeTrue();
      expect(presenter.ordenes()).toEqual([]);
      expect(presenter.total()).toBe(0);
    });
  });

  describe('codigoDe', () => {
    it('dado un alumnoId con codigo, cuando lo pido, deberia devolverlo', () => {
      expect(presenter.codigoDe('alumno-1')).toBe('ABC123');
    });

    it('dado un alumnoId sin codigo, cuando lo pido, deberia devolver el placeholder "----"', () => {
      expect(presenter.codigoDe('alumno-sin-codigo')).toBe('----');
    });
  });

  describe('navegacion', () => {
    it('dado el presenter, cuando vuelvo al inicio, deberia navegar a la homeUrl del usuario', () => {
      presenter.volverInicio();

      thenSeNavegoA('/tutor');
    });

    it('dado el presenter, cuando voy a ver pendientes, deberia navegar a /movimientos con el filtro de estado', () => {
      presenter.verPendientes();

      expect(router.navigate).toHaveBeenCalledWith(['/movimientos'], {
        queryParams: { estado: 'PENDIENTE,EN_PREPARACION' },
      });
    });
  });

  function givenSinUltimaOrden(): void {
    ultimaOrden.set(null);
  }

  function thenSeNavegoA(url: string): void {
    expect(router.navigateByUrl).toHaveBeenCalledWith(url);
  }
});
