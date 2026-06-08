import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { CarritoPresenter } from './carrito.presenter';
import { CarritoService } from '../../services/carrito.service';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { CompraService } from '../../services/compra.service';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { PresupuestoService } from '../../../presupuesto/services/presupuesto.service';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { ItemCarrito } from '../../models/carrito.model';

describe('CarritoPresenter', () => {
  let presenter: CarritoPresenter;
  let carritoServiceSpy: jasmine.SpyObj<CarritoService>;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let compraServiceSpy: jasmine.SpyObj<CompraService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let presupuestoServiceSpy: jasmine.SpyObj<PresupuestoService>;

  const mockAlumno: Alumno = {
    id: 'alumno-1',
    nombre: 'Adrian',
    apellido: 'Miere',
    grado: '3ero C',
    colegioId: 'colegio-1',
    saldo: 7000,
  };

  const mockItem1: ItemCarrito = {
    id: 'alumno-1__prod-coca__123',
    alumnoId: 'alumno-1',
    producto: {
      id: 'prod-coca',
      nombre: 'Coca-Cola 500ml',
      descripcion: 'Bebida',
      precio: 1200,
      categoria: { id: 'bebidas', descripcion: 'Bebidas' },
      clasificacionesSalud: [],
      imagen: '',
      estadoStock: 'DISPONIBLE',
    },
    cantidad: 1,
  };

  const mockItem2: ItemCarrito = {
    id: 'alumno-1__prod-jugo__456',
    alumnoId: 'alumno-1',
    producto: {
      id: 'prod-jugo',
      nombre: 'Jugo de Naranja 300ml',
      descripcion: 'Bebida',
      precio: 950,
      categoria: { id: 'bebidas', descripcion: 'Bebidas' },
      clasificacionesSalud: [],
      imagen: '',
      estadoStock: 'DISPONIBLE',
    },
    cantidad: 1,
  };

  let itemsSignal: any;

  beforeEach(() => {
    carritoServiceSpy = jasmine.createSpyObj('CarritoService', ['cambiarCantidad', 'quitar', 'limpiarAlumno', 'itemsPorAlumno']);
    alumnosServiceSpy = jasmine.createSpyObj('AlumnosService', ['getAlumnoById']);
    compraServiceSpy = jasmine.createSpyObj('CompraService', ['iniciarOrden']);
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['homeUrl']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
    presupuestoServiceSpy = jasmine.createSpyObj('PresupuestoService', ['getPresupuesto', 'cargarPrediccion']);

    itemsSignal = signal<ItemCarrito[]>([]);
    (carritoServiceSpy as any).items = itemsSignal;
    carritoServiceSpy.itemsPorAlumno.and.returnValue(new Map());

    alumnosServiceSpy.getAlumnoById.and.returnValue(mockAlumno);

    TestBed.configureTestingModule({
      providers: [
        CarritoPresenter,
        { provide: CarritoService, useValue: carritoServiceSpy },
        { provide: AlumnosService, useValue: alumnosServiceSpy },
        { provide: CompraService, useValue: compraServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: PresupuestoService, useValue: presupuestoServiceSpy },
      ],
    });

    presenter = TestBed.inject(CarritoPresenter);
  });

  it('debería crearse el presenter', () => {
    expect(presenter).toBeTruthy();
  });

  describe('Validación de Restricciones por Presupuesto', () => {
    it('debería marcar errorPresupuesto y deshabilitar checkout si se excede el límite de la categoría en el carrito', async () => {
      // Mock active budget with a limit of $2000 for Beverages
      const mockBudget = {
        id: 'budget-1',
        alumnoId: 'alumno-1',
        montoLimiteGeneral: 5000,
        periodo: 'DIARIO' as const,
        fechaInicio: '2026-06-07',
        activo: true,
        reglasCategoria: [
          {
            id: 'regla-1',
            categoriaId: 'cat-bebidas-uuid',
            descripcionCategoria: 'Bebidas e Infusiones',
            porcentajeLimite: 40,
            montoLimiteCalculado: 2000,
            activo: true,
          },
        ],
      };

      const mockSpending = {
        alumnoId: 'alumno-1',
        periodo: 'DIARIO' as const,
        gastoActual: 0,
        gastoPredicho: 0,
        promedioGastoDiario: 0,
        montoLimite: 5000,
        porcentajePresupuesto: 0,
        confianza: 1,
        diasRestantes: 1,
        categoriasMasConsumidas: [],
        resumenIa: '',
        alertas: [],
        recomendaciones: [],
      };

      presupuestoServiceSpy.getPresupuesto.and.resolveTo(mockBudget);
      presupuestoServiceSpy.cargarPrediccion.and.resolveTo(mockSpending);

      // Populate cart with Coca-Cola ($1200) and Jugo ($950) -> total $2150 (> $2000)
      const items = [mockItem1, mockItem2];
      itemsSignal.set(items);

      const itemsMap = new Map<string, ItemCarrito[]>();
      itemsMap.set('alumno-1', items);
      carritoServiceSpy.itemsPorAlumno.and.returnValue(itemsMap);

      // Trigger effect by forcing a tick or change detection (presenter effect runs automatically on signal change)
      TestBed.flushEffects();

      // Wait for promises to resolve
      await new Promise((resolve) => setTimeout(resolve, 50));

      const errores = presenter.erroresPresupuestoPorAlumno();
      expect(errores['alumno-1']).toContain('Supera el límite para la categoría "Bebidas e Infusiones"');
      expect(presenter.avanzarPosible()).toBeFalse();
      expect(presenter.advertencia()).toContain('Supera el límite para la categoría "Bebidas e Infusiones"');
    });

    it('debería no tener errores si los productos combinados no superan el presupuesto', async () => {
      const mockBudget = {
        id: 'budget-1',
        alumnoId: 'alumno-1',
        montoLimiteGeneral: 5000,
        periodo: 'DIARIO' as const,
        fechaInicio: '2026-06-07',
        activo: true,
        reglasCategoria: [
          {
            id: 'regla-1',
            categoriaId: 'cat-bebidas-uuid',
            descripcionCategoria: 'Bebidas e Infusiones',
            porcentajeLimite: 40,
            montoLimiteCalculado: 2000,
            activo: true,
          },
        ],
      };

      presupuestoServiceSpy.getPresupuesto.and.resolveTo(mockBudget);
      presupuestoServiceSpy.cargarPrediccion.and.resolveTo(undefined);

      // Cart has only Coca-Cola ($1200) -> total $1200 (<= $2000)
      const items = [mockItem1];
      itemsSignal.set(items);

      const itemsMap = new Map<string, ItemCarrito[]>();
      itemsMap.set('alumno-1', items);
      carritoServiceSpy.itemsPorAlumno.and.returnValue(itemsMap);

      TestBed.flushEffects();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const errores = presenter.erroresPresupuestoPorAlumno();
      expect(errores['alumno-1']).toBeUndefined();
      expect(presenter.avanzarPosible()).toBeTrue();
    });
  });
});
