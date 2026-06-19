import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { GuardarFavoritoModalComponent } from './guardar-favorito-modal.component';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { CarritosFavoritosService } from '../../../carritos-favoritos/services/carritos-favoritos.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { CarritoFavoritoResponse } from '../../../carritos-favoritos/models/carritos-favoritos.model';

// ─── Datos de prueba ────────────────────────────────────────────────────────

const hijosMock: Alumno[] = [
  { id: 'hijo-1', nombre: 'Tomás', apellido: 'López', grado: '3ro A', colegioId: 'col-1', saldo: 1000 },
  { id: 'hijo-2', nombre: 'Sofía', apellido: 'Martínez', grado: '4to B', colegioId: 'col-1', saldo: 500 },
];

const itemsMock = [
  { productId: 'prod-1', productName: 'Sándwich', price: 400, quantity: 2 },
  { productId: 'prod-2', productName: 'Jugo', price: 200, quantity: 1 },
];

const respuestaGuardadaMock: CarritoFavoritoResponse = {
  id: 'cart-fav-1',
  nombre: 'Almuerzo Tomás',
  alumnoId: 'hijo-1',
  alumnoNombre: 'Tomás',
  alumnoApellido: 'López',
  items: [],
};

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('GuardarFavoritoModalComponent', () => {
  let componente: GuardarFavoritoModalComponent;
  let fixture: ComponentFixture<GuardarFavoritoModalComponent>;

  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let carritosFavoritosServiceSpy: jasmine.SpyObj<CarritosFavoritosService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;

  // Signal reactiva para simular alumnos cargados
  const hijosSignal = signal<Alumno[]>(hijosMock);
  const esVistaAlumnoSignal = signal<boolean>(false);

  beforeEach(async () => {
    alumnosServiceSpy = jasmine.createSpyObj<AlumnosService>(
      'AlumnosService',
      ['asegurarCargados'],
      { alumnos: hijosSignal.asReadonly() }
    );
    alumnosServiceSpy.asegurarCargados.and.returnValue(Promise.resolve(hijosMock));

    carritosFavoritosServiceSpy = jasmine.createSpyObj<CarritosFavoritosService>(
      'CarritosFavoritosService',
      ['saveCarritoFavorito']
    );
    carritosFavoritosServiceSpy.saveCarritoFavorito.and.returnValue(of(respuestaGuardadaMock));

    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);

    usuarioServiceSpy = jasmine.createSpyObj<UsuarioService>(
      'UsuarioService',
      [],
      { esVistaAlumno: esVistaAlumnoSignal.asReadonly() }
    );

    await TestBed.configureTestingModule({
      imports: [GuardarFavoritoModalComponent],
      providers: [
        { provide: AlumnosService, useValue: alumnosServiceSpy },
        { provide: CarritosFavoritosService, useValue: carritosFavoritosServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GuardarFavoritoModalComponent);
    componente = fixture.componentInstance;

    componente.items = itemsMock;
    componente.initialNombre = 'Mi carrito';
    componente.initialAlumnoId = 'hijo-1';
    fixture.detectChanges();
  });

  // ── Creación ─────────────────────────────────────────────────────────────

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(componente).toBeTruthy();
  });

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  it('dado ngOnInit, debe inicializar nombre y alumnoId desde los @Input()', () => {
    expect(componente.nombre).toBe('Mi carrito');
    expect(componente.alumnoId).toBe('hijo-1');
  });

  it('dado ngOnInit, debe llamar a asegurarCargados del AlumnosService', () => {
    expect(alumnosServiceSpy.asegurarCargados).toHaveBeenCalled();
  });

  // ── Computed: total ───────────────────────────────────────────────────────

  it('dado que hay items con precio y cantidad, debe calcular el total correctamente', () => {
    // 400*2 + 200*1 = 1000
    expect(componente.total).toBe(1000);
  });

  it('dado que no hay items, el total debe ser 0', () => {
    componente.items = [];
    expect(componente.total).toBe(0);
  });

  // ── onClose ───────────────────────────────────────────────────────────────

  it('dado que se llama onClose, debe emitir el evento closeModal', () => {
    let emitido = false;
    componente.closeModal.subscribe(() => (emitido = true));
    componente.onClose();
    expect(emitido).toBeTrue();
  });

  // ── onSave: validaciones ──────────────────────────────────────────────────

  it('dado que nombre está vacío, onSave debe mostrar toast de error y no guardar', () => {
    componente.nombre = '   ';
    componente.onSave();
    expect(toastServiceSpy.mostrar).toHaveBeenCalledWith(
      'Por favor, ingresá un nombre para el carrito',
      'error'
    );
    expect(carritosFavoritosServiceSpy.saveCarritoFavorito).not.toHaveBeenCalled();
  });

  it('dado que alumnoId está vacío, onSave debe mostrar toast de error y no guardar', () => {
    componente.nombre = 'Carrito válido';
    componente.alumnoId = '';
    componente.onSave();
    expect(toastServiceSpy.mostrar).toHaveBeenCalledWith(
      'Por favor, seleccioná un hijo',
      'error'
    );
    expect(carritosFavoritosServiceSpy.saveCarritoFavorito).not.toHaveBeenCalled();
  });

  it('dado que items está vacío, onSave debe mostrar toast de error y no guardar', () => {
    componente.nombre = 'Carrito válido';
    componente.alumnoId = 'hijo-1';
    componente.items = [];
    componente.onSave();
    expect(toastServiceSpy.mostrar).toHaveBeenCalledWith(
      'No hay productos en el carrito para guardar',
      'error'
    );
    expect(carritosFavoritosServiceSpy.saveCarritoFavorito).not.toHaveBeenCalled();
  });

  // ── onSave: flujo exitoso ─────────────────────────────────────────────────

  it('dado que los datos son válidos y cartId es null, debe llamar saveCarritoFavorito con id null', () => {
    componente.nombre = 'Almuerzo';
    componente.alumnoId = 'hijo-1';
    componente.items = itemsMock;
    componente.cartId = null;
    componente.onSave();
    expect(carritosFavoritosServiceSpy.saveCarritoFavorito).toHaveBeenCalledWith(
      jasmine.objectContaining({ id: null, nombre: 'Almuerzo', alumnoId: 'hijo-1' })
    );
  });

  it('dado que el guardado es exitoso con cartId null, debe mostrar toast de éxito nuevo', () => {
    componente.nombre = 'Almuerzo';
    componente.alumnoId = 'hijo-1';
    componente.items = itemsMock;
    componente.cartId = null;
    componente.onSave();
    expect(toastServiceSpy.mostrar).toHaveBeenCalledWith(
      'Carrito guardado como favorito con éxito',
      'success'
    );
  });

  it('dado que el guardado es exitoso con cartId existente, debe mostrar toast de actualización', () => {
    carritosFavoritosServiceSpy.saveCarritoFavorito.and.returnValue(of(respuestaGuardadaMock));
    componente.nombre = 'Almuerzo';
    componente.alumnoId = 'hijo-1';
    componente.items = itemsMock;
    componente.cartId = 'cart-existente-1';
    componente.onSave();
    expect(toastServiceSpy.mostrar).toHaveBeenCalledWith(
      'Carrito favorito actualizado con éxito',
      'success'
    );
  });

  it('dado que el guardado es exitoso, debe emitir saveSuccess y closeModal', () => {
    let saveEmitido = false;
    let closeEmitido = false;
    componente.saveSuccess.subscribe(() => (saveEmitido = true));
    componente.closeModal.subscribe(() => (closeEmitido = true));

    componente.nombre = 'Almuerzo';
    componente.alumnoId = 'hijo-1';
    componente.items = itemsMock;
    componente.onSave();

    expect(saveEmitido).toBeTrue();
    expect(closeEmitido).toBeTrue();
  });

  it('dado que el guardado es exitoso, isSaving debe volver a false', () => {
    componente.nombre = 'Almuerzo';
    componente.alumnoId = 'hijo-1';
    componente.items = itemsMock;
    componente.onSave();
    expect(componente.isSaving).toBeFalse();
  });

  // ── onSave: flujo de error ────────────────────────────────────────────────

  it('dado que el servicio lanza un error, debe mostrar toast de error y desactivar isSaving', () => {
    carritosFavoritosServiceSpy.saveCarritoFavorito.and.returnValue(
      throwError(() => new Error('Error HTTP'))
    );
    componente.nombre = 'Almuerzo';
    componente.alumnoId = 'hijo-1';
    componente.items = itemsMock;
    componente.onSave();

    expect(toastServiceSpy.mostrar).toHaveBeenCalledWith(
      'Hubo un error al guardar el carrito favorito',
      'error'
    );
    expect(componente.isSaving).toBeFalse();
  });

  // ── Template: lista de items vacía vs con items ───────────────────────────

  it('dado que no hay items, debe mostrar mensaje de carrito vacío', () => {
    componente.items = [];
    fixture.detectChanges();
    const parrafo = fixture.debugElement.query(By.css('.empty-items'));
    expect(parrafo).not.toBeNull();
    expect(parrafo.nativeElement.textContent).toContain('No hay productos en este carrito');
  });

  it('dado que hay items, debe renderizarlos en el listado', () => {
    fixture.detectChanges();
    const filas = fixture.debugElement.queryAll(By.css('.item-row'));
    expect(filas.length).toBe(2);
  });

  // ── Template: @if (!esVistaAlumno) selector de hijo ──────────────────────

  it('dado que NO es vista alumno, debe mostrar el selector de hijo', () => {
    esVistaAlumnoSignal.set(false);
    fixture.detectChanges();
    const selector = fixture.debugElement.query(By.css('#student-select'));
    expect(selector).not.toBeNull();
  });

  it('dado que ES vista alumno, no debe mostrar el selector de hijo', () => {
    esVistaAlumnoSignal.set(true);
    fixture.detectChanges();
    const selector = fixture.debugElement.query(By.css('#student-select'));
    expect(selector).toBeNull();
  });

  // ── Template: título según cartId ────────────────────────────────────────

  it('dado que cartId es null, el título debe ser "Guardar como Favorito"', () => {
    componente.cartId = null;
    fixture.detectChanges();
    const titulo = fixture.debugElement.query(By.css('.modal-header__title'));
    expect(titulo.nativeElement.textContent).toContain('Guardar como Favorito');
  });

  it('dado que cartId tiene valor, el título debe ser "Editar Carrito Favorito"', () => {
    componente.cartId = 'cart-1';
    fixture.detectChanges();
    const titulo = fixture.debugElement.query(By.css('.modal-header__title'));
    expect(titulo.nativeElement.textContent).toContain('Editar Carrito Favorito');
  });

  // ── Template: spinner mientras isSaving ──────────────────────────────────

  it('dado que isSaving es false, NO debe mostrar el spinner', () => {
    componente.isSaving = false;
    fixture.detectChanges();
    const spinner = fixture.debugElement.query(By.css('.fa-spinner'));
    expect(spinner).toBeNull();
  });

  // ── Template: hijos en el select ─────────────────────────────────────────

  it('dado que hay hijos cargados, debe renderizar opciones en el select', () => {
    esVistaAlumnoSignal.set(false);
    fixture.detectChanges();
    const opciones = fixture.debugElement.queryAll(By.css('#student-select option'));
    // +1 por la opción deshabilitada "Seleccioná un hijo"
    expect(opciones.length).toBeGreaterThanOrEqual(hijosMock.length);
  });
});
