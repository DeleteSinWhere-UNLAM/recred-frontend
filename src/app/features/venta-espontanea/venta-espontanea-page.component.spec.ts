import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { of, throwError } from 'rxjs';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { DialogService } from '../../shared/services/dialog.service';
import { FeriadosService } from '../../shared/services/feriados.service';
import { ProductoVenta, VentaEspontaneaService } from './services/venta-espontanea';
import {
  ALUMNO_ID_TEST,
  AlumnoResumenMother,
  ProductoVentaMother,
} from './venta-espontanea.mother';
import { VentaEspontaneaPageComponent } from './venta-espontanea-page.component';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

interface ServiceFake {
  alumnos: ReturnType<typeof signal<ReturnType<typeof AlumnoResumenMother.crearVarios>>>;
  productos: ReturnType<typeof signal<ReturnType<typeof ProductoVentaMother.crearVarios>>>;
  cargarAlumnos: jasmine.Spy;
  cargarProductosDelAlumno: jasmine.Spy;
  procesarVenta: jasmine.Spy;
}

describe('VentaEspontaneaPageComponent', () => {
  let fixture: ComponentFixture<VentaEspontaneaPageComponent>;
  let component: VentaEspontaneaPageComponent;
  let service: ServiceFake;
  let router: jasmine.SpyObj<Router>;
  let feriadosService: jasmine.SpyObj<FeriadosService>;
  let dialogService: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    service = {
      alumnos: signal(AlumnoResumenMother.crearVarios()),
      productos: signal(ProductoVentaMother.crearVarios()),
      cargarAlumnos: jasmine.createSpy('cargarAlumnos').and.returnValue(of(AlumnoResumenMother.crearVarios())),
      cargarProductosDelAlumno: jasmine.createSpy('cargarProductosDelAlumno').and.returnValue(of([])),
      procesarVenta: jasmine.createSpy('procesarVenta').and.returnValue(of({})),
    };

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    feriadosService = jasmine.createSpyObj<FeriadosService>('FeriadosService', ['esFeriadoHoy']);
    feriadosService.esFeriadoHoy.and.returnValue(of({ esFeriado: false }));
    dialogService = jasmine.createSpyObj<DialogService>('DialogService', ['alert']);
    dialogService.alert.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [VentaEspontaneaPageComponent],
      providers: [
        { provide: VentaEspontaneaService, useValue: service },
        { provide: Router, useValue: router },
        { provide: FeriadosService, useValue: feriadosService },
        { provide: DialogService, useValue: dialogService },
      ],
    })
      .overrideComponent(VentaEspontaneaPageComponent, {
        remove: { imports: [NavbarComponent, ZXingScannerModule] },
        add: { imports: [NavbarStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(VentaEspontaneaPageComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => localStorage.clear());

  describe('ngOnInit', () => {
    it('cuando se monta en dia laborable, deberia cargar los alumnos y verificar el dia laborable', () => {
      givenFechaMockeada(new Date(2026, 6, 1));

      try {
        whenMonto();

        expect(service.cargarAlumnos).toHaveBeenCalled();
        expect(feriadosService.esFeriadoHoy).toHaveBeenCalled();
      } finally {
        jasmine.clock().uninstall();
      }
    });
  });

  describe('verificarDiaLaborable', () => {
    it('dado un domingo, cuando verifico el dia, deberia bloquear la venta', () => {
      givenFechaMockeada(new Date('2026-07-05'));

      component.verificarDiaLaborable();

      expect(component.esDiaNoLaborable()).toBeTrue();
      expect(component.mensajeBloqueoDia()).toBe('Hoy es fin de semana.');
      expect(component.bloqueadoPorDiaNoLaborable()).toBeTrue();
      jasmine.clock().uninstall();
    });

    it('dado un feriado, cuando verifico el dia, deberia setear el mensaje con el motivo', () => {
      givenFechaMockeada(new Date('2026-07-01'));
      feriadosService.esFeriadoHoy.and.returnValue(
        of({ esFeriado: true, motivo: 'Día de la Independencia' }),
      );

      component.verificarDiaLaborable();

      expect(component.esDiaNoLaborable()).toBeTrue();
      expect(component.mensajeBloqueoDia()).toContain('Día de la Independencia');
      jasmine.clock().uninstall();
    });

    it('dado que ya estaba habilitado en localStorage, cuando verifico, deberia setear la flag en true', () => {
      givenFinesDeSemanaHabilitados();

      component.verificarDiaLaborable();

      expect(component.ventasDiasNoLaborablesHabilitadas()).toBeTrue();
    });
  });

  describe('toggleDiasNoLaborables y habilitarDiasNoLaborables', () => {
    it('cuando toggleo el checkbox a true, deberia persistir en localStorage y actualizar el bloqueo', () => {
      const event = { target: { checked: true } } as unknown as Event;

      component.toggleDiasNoLaborables(event);

      expect(component.ventasDiasNoLaborablesHabilitadas()).toBeTrue();
      expect(localStorage.getItem('recred_habilitar_fines_semana')).toBe('true');
    });

    it('cuando habilito los dias no laborables, deberia setear localStorage a true y actualizar el bloqueo', () => {
      component.esDiaNoLaborable.set(true);

      component.habilitarDiasNoLaborables();

      expect(component.ventasDiasNoLaborablesHabilitadas()).toBeTrue();
      expect(component.bloqueadoPorDiaNoLaborable()).toBeFalse();
    });
  });

  describe('isBloqueado y getMotivoBloqueo', () => {
    it('dado un producto bloqueado por el tutor, cuando consulto, isBloqueado deberia ser true con su motivo', () => {
      const p = ProductoVentaMother.crearBloqueado();

      expect(component.isBloqueado(p)).toBeTrue();
      expect(component.getMotivoBloqueo(p)).toBe('Bloqueado por el tutor');
    });

    it('dado un producto sin stock, cuando consulto, el motivo deberia ser "Sin stock disponible"', () => {
      const p = ProductoVentaMother.crearSinStock();

      expect(component.isBloqueado(p)).toBeTrue();
      expect(component.getMotivoBloqueo(p)).toBe('Sin stock disponible');
    });

    it('dado un producto que supera presupuesto, cuando consulto, el motivo deberia ser "Supera límite de presupuesto"', () => {
      const p = ProductoVentaMother.crearSuperaPresupuesto();

      expect(component.isBloqueado(p)).toBeTrue();
      expect(component.getMotivoBloqueo(p)).toBe('Supera límite de presupuesto');
    });

    it('dado un producto libre, cuando consulto, isBloqueado deberia ser false', () => {
      const p = ProductoVentaMother.crear();

      expect(component.isBloqueado(p)).toBeFalse();
    });
  });

  describe('filtrarAlumnos', () => {
    beforeEach(() => whenMonto());

    it('dado un query "juan", cuando filtro, deberia devolver solo el alumno Juan', () => {
      component.busquedaAlumno = 'juan';

      component.filtrarAlumnos();

      expect(component.alumnosFiltrados().length).toBe(1);
      expect(component.alumnosFiltrados()[0].nombre).toBe('Juan');
    });

    it('dado un query "87654321", cuando filtro por DNI, deberia devolver el alumno correspondiente', () => {
      component.busquedaAlumno = '87654321';

      component.filtrarAlumnos();

      expect(component.alumnosFiltrados().length).toBe(1);
      expect(component.alumnosFiltrados()[0].apellido).toBe('Lopez');
    });

    it('dado un query vacio, cuando filtro, deberia devolver lista vacia', () => {
      component.busquedaAlumno = '';

      component.filtrarAlumnos();

      expect(component.alumnosFiltrados()).toEqual([]);
    });
  });

  describe('seleccionarAlumno / cambiarAlumno', () => {
    it('dado un alumno, cuando lo selecciono, deberia setearlo + limpiar carrito + cargar productos', () => {
      const alumno = AlumnoResumenMother.crear();

      component.seleccionarAlumno(alumno);

      expect(component.alumnoSeleccionado()).toEqual(alumno);
      expect(component.carrito().size).toBe(0);
      expect(service.cargarProductosDelAlumno).toHaveBeenCalledWith(alumno.id);
    });

    it('dado un alumno seleccionado, cuando cambio de alumno, deberia resetear alumnoSeleccionado y carrito', () => {
      component.alumnoSeleccionado.set(AlumnoResumenMother.crear());

      component.cambiarAlumno();

      expect(component.alumnoSeleccionado()).toBeNull();
      expect(component.carrito().size).toBe(0);
    });
  });

  describe('toggleEscaneo y onCodeResult', () => {
    beforeEach(() => whenMonto());

    it('cuando toggleo el escaneo, deberia invertir la flag', () => {
      expect(component.escaneando()).toBeFalse();

      component.toggleEscaneo();

      expect(component.escaneando()).toBeTrue();
    });

    it('dado un QR con JSON válido con alumnoId conocido, cuando lo leo, deberia seleccionar el alumno', () => {
      component.onCodeResult(JSON.stringify({ alumnoId: ALUMNO_ID_TEST }));

      expect(component.alumnoSeleccionado()?.id).toBe(ALUMNO_ID_TEST);
    });

    it('dado un QR con alumnoId inexistente, cuando lo leo, deberia mostrar mensaje de error', () => {
      component.onCodeResult(JSON.stringify({ alumnoId: 'no-existe' }));

      expect(component.mensajeError()).toBe('No se encontró el alumno del código QR escaneado.');
      expect(component.escaneando()).toBeFalse();
    });
  });

  describe('carrito', () => {
    beforeEach(() => whenMonto());

    it('dado un producto, cuando sumo, deberia agregarlo con cantidad 1', () => {
      const p = ProductoVentaMother.crear();

      component.sumar(p);

      expect(component.getCantidad(p)).toBe(1);
    });

    it('dado un producto con cantidad 2, cuando resto dos veces, deberia bajar a 1 y despues eliminarlo', () => {
      const p = ProductoVentaMother.crear();
      component.sumar(p);
      component.sumar(p);

      component.restar(p);
      expect(component.getCantidad(p)).toBe(1);

      component.restar(p);
      expect(component.getCantidad(p)).toBe(0);
      expect(component.carrito().has(p.id)).toBeFalse();
    });

    it('dado dos productos con cantidades, cuando pido getTotal, deberia sumar precio * cantidad', () => {
      const productos = ProductoVentaMother.crearVarios();
      service.productos.set(productos);
      component.sumar(productos[0]);
      component.sumar(productos[0]);
      component.sumar(productos[1]);

      expect(component.getTotal()).toBe(productos[0].precio * 2 + productos[1].precio);
    });
  });

  describe('confirmarVenta', () => {
    beforeEach(() => whenMonto());

    it('dado que no hay alumno seleccionado, cuando confirmo, no deberia llamar al service', () => {
      component.confirmarVenta();

      expect(service.procesarVenta).not.toHaveBeenCalled();
    });

    it('dado un alumno pero carrito vacio, cuando confirmo, no deberia llamar al service', () => {
      component.alumnoSeleccionado.set(AlumnoResumenMother.crear());

      component.confirmarVenta();

      expect(service.procesarVenta).not.toHaveBeenCalled();
    });

    it('dado un alumno y carrito con items, cuando confirmo con exito, deberia mostrar alerta y navegar a /kiosquero', async () => {
      givenCarritoConItems();

      component.confirmarVenta();
      await fixture.whenStable();

      expect(service.procesarVenta).toHaveBeenCalled();
      expect(dialogService.alert).toHaveBeenCalledWith('¡Venta realizada con éxito!', 'Venta Exitosa');
      expect(router.navigate).toHaveBeenCalledWith(['/kiosquero']);
      expect(component.procesando()).toBeFalse();
    });

    it('dado que el service falla con mensaje del back, cuando confirmo, deberia mostrar ese mensaje', () => {
      givenCarritoConItems();
      service.procesarVenta.and.returnValue(
        throwError(() => ({ error: { mensaje: 'Saldo insuficiente' } })),
      );

      component.confirmarVenta();

      expect(component.mensajeError()).toBe('Saldo insuficiente');
      expect(component.procesando()).toBeFalse();
    });

    it('dado que el service falla sin mensaje del back, cuando confirmo, deberia usar el err.message', () => {
      givenCarritoConItems();
      service.procesarVenta.and.returnValue(throwError(() => new Error('Timeout')));

      component.confirmarVenta();

      expect(component.mensajeError()).toBe('Timeout');
    });
  });

  function givenFechaMockeada(fecha: Date): void {
    jasmine.clock().install();
    jasmine.clock().mockDate(fecha);
  }

  function givenFinesDeSemanaHabilitados(): void {
    localStorage.setItem('recred_habilitar_fines_semana', 'true');
  }

  function givenCarritoConItems(): ProductoVenta[] {
    component.alumnoSeleccionado.set(AlumnoResumenMother.crear());
    const productos = ProductoVentaMother.crearVarios();
    service.productos.set(productos);
    component.sumar(productos[0]);
    return productos;
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
