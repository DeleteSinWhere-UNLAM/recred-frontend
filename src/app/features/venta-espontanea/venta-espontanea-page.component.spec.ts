import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Component, Input, signal } from '@angular/core';
import { VentaEspontaneaPageComponent } from './venta-espontanea-page.component';
import { VentaEspontaneaService, AlumnoResumen, ProductoVenta } from './services/venta-espontanea';
import { FeriadosService } from '../../shared/services/feriados.service';
import { ZXingScannerModule } from '@zxing/ngx-scanner'; // Testeable sin montar hardware real si no interaccionamos
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
class MockNavbarComponent {
  @Input() userName = '';
}

describe('VentaEspontaneaPageComponent', () => {
  let componente: VentaEspontaneaPageComponent;
  let fixture: ComponentFixture<VentaEspontaneaPageComponent>;

  let mockVentaService: jasmine.SpyObj<VentaEspontaneaService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockFeriadosService: jasmine.SpyObj<FeriadosService>;

  const mockAlumno: AlumnoResumen = {
    id: 'alum-1',
    nombre: 'Pedro',
    apellido: 'Gonzalez',
    dni: '12345678'
  };

  const mockProducto: ProductoVenta = {
    id: 'prod-1',
    nombre: 'Galleta',
    precio: 1000,
    categoria: { descripcion: 'Kiosco' } as any,
    clasificacionesSalud: [],
    bloqueado: false,
    superaPresupuesto: false,
    estadoStock: 'DISPONIBLE'
  } as unknown as ProductoVenta;

  beforeEach(async () => {
    mockVentaService = jasmine.createSpyObj('VentaEspontaneaService', ['cargarAlumnos', 'cargarProductosDelAlumno', 'procesarVenta']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockFeriadosService = jasmine.createSpyObj('FeriadosService', ['esFeriadoHoy']);

    // Mocks por defecto
    mockVentaService.cargarAlumnos.and.returnValue(of([]));
    (mockVentaService as any).alumnos = signal([mockAlumno]);
    (mockVentaService as any).productos = signal([mockProducto]);
    mockFeriadosService.esFeriadoHoy.and.returnValue(of({ esFeriado: false, motivo: '' }));

    // Mockeamos la fecha para que siempre sea Lunes (día 1)
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2024-05-06T12:00:00Z')); // Lunes 6 de mayo de 2024

    spyOn(localStorage, 'getItem').and.returnValue('false');
    spyOn(localStorage, 'setItem');

    await TestBed.configureTestingModule({
      imports: [VentaEspontaneaPageComponent] // Importa modulos y el Zxing
    })
    .overrideComponent(VentaEspontaneaPageComponent, {
      remove: { imports: [ZXingScannerModule, NavbarComponent] },
      add: { imports: [MockNavbarComponent] }
    })
    .overrideProvider(VentaEspontaneaService, { useValue: mockVentaService })
    .overrideProvider(Router, { useValue: mockRouter })
    .overrideProvider(FeriadosService, { useValue: mockFeriadosService })
    .compileComponents();

    fixture = TestBed.createComponent(VentaEspontaneaPageComponent);
    componente = fixture.componentInstance;
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('Control de Días Laborables y Feriados', () => {
    it('dado que es fin de semana, debe mostrar bloqueo', () => {
      jasmine.clock().mockDate(new Date('2024-05-05T12:00:00Z')); // Domingo
      
      fixture.detectChanges(); // Ejecuta ngOnInit

      expect(componente.esDiaNoLaborable()).toBeTrue();
      expect(componente.bloqueadoPorDiaNoLaborable()).toBeTrue();
      expect(componente.mensajeBloqueoDia()).toContain('fin de semana');
    });

    it('dado que es dia de semana pero feriado, debe mostrar bloqueo', () => {
      mockFeriadosService.esFeriadoHoy.and.returnValue(of({ esFeriado: true, motivo: '25 de Mayo' }));
      
      fixture.detectChanges();

      expect(componente.esDiaNoLaborable()).toBeTrue();
      expect(componente.bloqueadoPorDiaNoLaborable()).toBeTrue();
      expect(componente.mensajeBloqueoDia()).toContain('25 de Mayo');
    });

    it('dado que el localstorage tenia la habilitacion manual, no debe bloquear a pesar de ser feriado', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue('true');
      mockFeriadosService.esFeriadoHoy.and.returnValue(of({ esFeriado: true, motivo: 'Feriado' }));
      
      fixture.detectChanges();

      expect(componente.ventasDiasNoLaborablesHabilitadas()).toBeTrue();
      expect(componente.bloqueadoPorDiaNoLaborable()).toBeFalse();
    });

    it('dado que clickea habilitar manual, debe desbloquear y guardar en storage', () => {
      jasmine.clock().mockDate(new Date('2024-05-05T12:00:00Z')); // Domingo (Bloquea)
      fixture.detectChanges();

      componente.habilitarDiasNoLaborables();

      expect(componente.bloqueadoPorDiaNoLaborable()).toBeFalse();
      expect(localStorage.setItem).toHaveBeenCalledWith('recred_habilitar_fines_semana', 'true');
    });
  });

  describe('Busqueda y seleccion de alumno', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('dado que filtra por nombre, debe encontrar coincidencias e ignorar caps', () => {
      componente.busquedaAlumno = 'PEDr';
      componente.filtrarAlumnos();
      expect(componente.alumnosFiltrados().length).toBe(1);
    });

    it('dado que filtra string vacio, debe vaciar la lista de resultados', () => {
      componente.busquedaAlumno = '';
      componente.filtrarAlumnos();
      expect(componente.alumnosFiltrados().length).toBe(0);
    });

    it('dado que selecciona alumno, debe limpiar buscador y cargar sus productos', () => {
      mockVentaService.cargarProductosDelAlumno.and.returnValue(of([]));
      componente.busquedaAlumno = 'Pedro';
      componente.escaneando.set(true);

      componente.seleccionarAlumno(mockAlumno);

      expect(componente.alumnoSeleccionado()).toEqual(mockAlumno);
      expect(componente.busquedaAlumno).toBe('');
      expect(componente.escaneando()).toBeFalse();
      expect(mockVentaService.cargarProductosDelAlumno).toHaveBeenCalledWith('alum-1');
    });

    it('dado que simula el escaneo con qr valido, debe seleccionar el alumno', () => {
      spyOn(componente, 'seleccionarAlumno');
      
      // onCodeResult lee string json
      componente.onCodeResult('{"alumnoId":"alum-1"}');
      
      expect(componente.seleccionarAlumno).toHaveBeenCalledWith(mockAlumno);
    });

    it('dado que simula el escaneo con qr no encontrado, debe mostrar error', () => {
      spyOn(componente, 'seleccionarAlumno');
      
      componente.onCodeResult('{"alumnoId":"no-existe"}');
      
      expect(componente.seleccionarAlumno).not.toHaveBeenCalled();
      expect(componente.mensajeError()).toContain('No se encontró el alumno');
    });
  });

  describe('Carrito e interacciones de venta', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockVentaService.cargarProductosDelAlumno.and.returnValue(of([]));
      componente.seleccionarAlumno(mockAlumno);
    });

    it('dado estado de producto bloqueado, isBloqueado debe identificar el estado correctamente', () => {
      const prodA = { ...mockProducto, bloqueado: true };
      const prodB = { ...mockProducto, superaPresupuesto: true };
      const prodC = { ...mockProducto, estadoStock: 'SIN_STOCK' };
      const prodSano = { ...mockProducto };

      expect(componente.isBloqueado(prodA as any)).toBeTrue();
      expect(componente.isBloqueado(prodB as any)).toBeTrue();
      expect(componente.isBloqueado(prodC as any)).toBeTrue();
      expect(componente.isBloqueado(prodSano as any)).toBeFalse();

      expect(componente.getMotivoBloqueo(prodA as any)).toContain('Bloqueado por el tutor');
      expect(componente.getMotivoBloqueo(prodB as any)).toContain('Supera límite');
      expect(componente.getMotivoBloqueo(prodC as any)).toContain('Sin stock');
    });

    it('dado sumar y restar, debe manejar la cantidad en el carrito', () => {
      // Sumar
      componente.sumar(mockProducto);
      expect(componente.getCantidad(mockProducto)).toBe(1);

      // Sumar denuevo
      componente.sumar(mockProducto);
      expect(componente.getCantidad(mockProducto)).toBe(2);

      // Restar
      componente.restar(mockProducto);
      expect(componente.getCantidad(mockProducto)).toBe(1);

      // Restar hasta 0 elimina del Map
      componente.restar(mockProducto);
      expect(componente.getCantidad(mockProducto)).toBe(0);
      expect(componente.carrito().has('prod-1')).toBeFalse();
    });

    it('dado getTotal, debe sumar precio * cantidad', () => {
      componente.sumar(mockProducto);
      componente.sumar(mockProducto); // 2 * 1000 = 2000
      expect(componente.getTotal()).toBe(2000);
    });

    it('dado confirmarVenta con exito, debe llamar al servicio, mostrar alert y ruteo', () => {
      spyOn(window, 'alert');
      mockVentaService.procesarVenta.and.returnValue(of(undefined));
      
      componente.sumar(mockProducto);
      componente.confirmarVenta();

      expect(mockVentaService.procesarVenta).toHaveBeenCalledWith('alum-1', jasmine.arrayContaining([
        jasmine.objectContaining({ id: 'prod-1', cantidad: 1 })
      ]));
      expect(window.alert).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/kiosquero']);
      expect(componente.procesando()).toBeFalse();
    });

    it('dado confirmarVenta con error, debe mostrar el error en pantalla', () => {
      mockVentaService.procesarVenta.and.returnValue(throwError(() => ({ error: { mensaje: 'Saldo insuficiente' } })));
      
      componente.sumar(mockProducto);
      componente.confirmarVenta();

      expect(componente.mensajeError()).toBe('Saldo insuficiente');
      expect(componente.procesando()).toBeFalse();
    });
  });
});
