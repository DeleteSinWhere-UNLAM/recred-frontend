import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { OrdenAlumnoCardComponent } from './orden-alumno-card.component';
import { CarritoService } from '../../services/carrito.service';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { ItemCarrito } from '../../models/carrito.model';
import { Producto } from '../../../buffet/models/producto.model';
import { RecreoOpcion } from '../../carrito/presenter/carrito.presenter';

// ─── Datos de prueba ────────────────────────────────────────────────────────

const productoMock: Producto = {
  id: 'prod-1',
  nombre: 'Empanada',
  descripcion: 'Riquísima',
  precio: 600,
  categoria: { id: 'cat-1', descripcion: 'Comidas' },
  clasificacionesSalud: [],
  imagen: 'https://img.com/emp.jpg',
  estadoStock: 'DISPONIBLE',
};

const alumnoConFoto: Alumno = {
  id: 'alumno-1',
  nombre: 'Lucas',
  apellido: 'Díaz',
  grado: '5to A',
  colegioId: 'col-1',
  saldo: 2000,
  urlFotoPerfil: 'https://example.com/lucas.jpg',
};

const alumnoSinFoto: Alumno = {
  id: 'alumno-2',
  nombre: 'Ana',
  apellido: 'Torres',
  grado: '3ro B',
  colegioId: 'col-1',
  saldo: 500,
  urlFotoPerfil: null,
};

const itemsMock: ItemCarrito[] = [
  { id: 'item-1', alumnoId: 'alumno-1', producto: productoMock, cantidad: 3 },
];

const recreosDisponiblesMock: RecreoOpcion[] = [
  { recreo: 'PRIMER_RECREO', descripcion: '1er Recreo', bloqueado: false },
  { recreo: 'SEGUNDO_RECREO', descripcion: '2do Recreo', bloqueado: true, motivo: 'tiempo' },
];

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('OrdenAlumnoCardComponent', () => {
  let componente: OrdenAlumnoCardComponent;
  let fixture: ComponentFixture<OrdenAlumnoCardComponent>;
  let servicioCarritoSpy: jasmine.SpyObj<CarritoService>;

  beforeEach(async () => {
    servicioCarritoSpy = jasmine.createSpyObj<CarritoService>('CarritoService', [
      'puedeAgregar',
    ]);
    servicioCarritoSpy.puedeAgregar.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [OrdenAlumnoCardComponent],
      providers: [
        { provide: CarritoService, useValue: servicioCarritoSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdenAlumnoCardComponent);
    componente = fixture.componentInstance;

    // Inputs requeridos
    componente.alumno = alumnoConFoto;
    componente.items = itemsMock;
    componente.recreosDisponibles = recreosDisponiblesMock;
    fixture.detectChanges();
  });

  // ── Creación ─────────────────────────────────────────────────────────────

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(componente).toBeTruthy();
  });

  // ── @Input() alumno ───────────────────────────────────────────────────────

  it('dado que recibe un alumno, debe reflejar el alumnoActual', () => {
    expect(componente.alumnoActual()).toEqual(alumnoConFoto);
  });

  it('dado que se actualiza el alumno, debe actualizar el signal', () => {
    fixture.componentRef.setInput('alumno', alumnoSinFoto);
    fixture.detectChanges();
    expect(componente.alumnoActual()?.id).toBe('alumno-2');
  });

  // ── @Input() items ────────────────────────────────────────────────────────

  it('dado que recibe items, debe reflejarlos en itemsActuales', () => {
    expect(componente.itemsActuales().length).toBe(1);
  });

  // ── Computed: iniciales ───────────────────────────────────────────────────

  it('dado alumno Lucas Díaz, las iniciales deben ser "LD"', () => {
    expect(componente.iniciales()).toBe('LD');
  });

  it('dado alumno Ana Torres, las iniciales deben ser "AT"', () => {
    fixture.componentRef.setInput('alumno', alumnoSinFoto);
    fixture.detectChanges();
    expect(componente.iniciales()).toBe('AT');
  });

  // ── Computed: nombreCompleto ──────────────────────────────────────────────

  it('dado alumno Lucas Díaz, el nombreCompleto debe ser "Lucas Díaz"', () => {
    expect(componente.nombreCompleto()).toBe('Lucas Díaz');
  });

  // ── Computed: urlFotoPerfil ───────────────────────────────────────────────

  it('dado que el alumno tiene foto, urlFotoPerfil debe retornarla', () => {
    expect(componente.urlFotoPerfil()).toBe('https://example.com/lucas.jpg');
  });

  it('dado que el alumno no tiene foto, urlFotoPerfil debe retornar null', () => {
    fixture.componentRef.setInput('alumno', alumnoSinFoto);
    fixture.detectChanges();
    expect(componente.urlFotoPerfil()).toBeNull();
  });

  // ── Computed: subtotal ────────────────────────────────────────────────────

  it('dado items con precio 600 y cantidad 3, el subtotal debe ser 1800', () => {
    expect(componente.subtotal()).toBe(1800);
  });

  it('dado items vacíos, el subtotal debe ser 0', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(componente.subtotal()).toBe(0);
  });

  // ── Computed: subtotalFormateado ──────────────────────────────────────────

  it('dado subtotal de 1800, debe formatearlo correctamente', () => {
    expect(componente.subtotalFormateado()).toContain('1.800');
  });

  // ── Computed: saldoFormateado ─────────────────────────────────────────────

  it('dado alumno con saldo 2000, debe formatearlo como $ 2.000', () => {
    expect(componente.saldoFormateado()).toContain('2.000');
  });

  // ── Computed: saldoInsuficiente ───────────────────────────────────────────

  it('dado que el saldo (2000) supera el subtotal (1800), saldoInsuficiente debe ser false', () => {
    expect(componente.saldoInsuficiente()).toBeFalse();
  });

  it('dado que el subtotal supera el saldo, saldoInsuficiente debe ser true', () => {
    const alumnoSaldo500: Alumno = { ...alumnoConFoto, saldo: 500 };
    fixture.componentRef.setInput('alumno', alumnoSaldo500);
    fixture.detectChanges();
    expect(componente.saldoInsuficiente()).toBeTrue();
  });

  // ── Computed: fechaFormateada ─────────────────────────────────────────────

  it('dado fecha "2025-09-15", debe formatearla como "15/09/2025"', () => {
    fixture.componentRef.setInput('fecha', '2025-09-15');
    fixture.detectChanges();
    expect(componente.fechaFormateada()).toBe('15/09/2025');
  });

  it('dado que la fecha está vacía, debe retornar "—"', () => {
    fixture.componentRef.setInput('fecha', '');
    fixture.detectChanges();
    expect(componente.fechaFormateada()).toBe('—');
  });

  // ── Computed: recreoLabel ─────────────────────────────────────────────────

  it('dado recreo PRIMER_RECREO, debe retornar "1er Recreo"', () => {
    fixture.componentRef.setInput('recreo', 'PRIMER_RECREO');
    fixture.detectChanges();
    expect(componente.recreoLabel).toBe('1er Recreo');
  });

  it('dado recreo MEDIODIA, debe retornar "Mediodía"', () => {
    fixture.componentRef.setInput('recreo', 'MEDIODIA');
    fixture.detectChanges();
    expect(componente.recreoLabel).toBe('Mediodía');
  });

  // ── Template: @if(alumno) ─────────────────────────────────────────────────

  it('dado que el alumno está definido, debe renderizar el article', () => {
    const article = fixture.debugElement.query(By.css('.orden-alumno'));
    expect(article).not.toBeNull();
  });

  it('dado que el alumno NO está definido, no debe renderizar el article', () => {
    const fixtureVacio = TestBed.createComponent(OrdenAlumnoCardComponent);
    fixtureVacio.componentInstance.items = [];
    fixtureVacio.detectChanges();
    const article = fixtureVacio.debugElement.query(By.css('.orden-alumno'));
    expect(article).toBeNull();
  });

  // ── Template: foto vs iniciales ───────────────────────────────────────────

  it('dado que el alumno tiene foto, debe mostrar el <img> de avatar', () => {
    const img = fixture.debugElement.query(By.css('.orden-alumno__avatar-img'));
    expect(img).not.toBeNull();
  });

  it('dado que el alumno no tiene foto, debe mostrar las iniciales', () => {
    fixture.componentRef.setInput('alumno', alumnoSinFoto);
    fixture.detectChanges();
    const img = fixture.debugElement.query(By.css('.orden-alumno__avatar-img'));
    const span = fixture.debugElement.query(By.css('.orden-alumno__avatar span'));
    expect(img).toBeNull();
    expect(span.nativeElement.textContent.trim()).toBe('AT');
  });

  // ── Template: alerta saldo insuficiente ───────────────────────────────────

  it('dado saldo insuficiente, debe mostrar la alerta de saldo', () => {
    const alumnoSaldo100: Alumno = { ...alumnoConFoto, saldo: 100 };
    fixture.componentRef.setInput('alumno', alumnoSaldo100);
    fixture.detectChanges();
    const alertas = fixture.debugElement.queryAll(By.css('.orden-alumno__alerta'));
    expect(alertas.length).toBeGreaterThan(0);
  });

  it('dado saldo suficiente, no debe mostrar la alerta de saldo', () => {
    // saldo 2000 > subtotal 1800
    const alertas = fixture.debugElement.queryAll(By.css('.orden-alumno__alerta'));
    expect(alertas.length).toBe(0);
  });

  // ── Template: alerta motivoBloqueoPresupuesto ─────────────────────────────

  it('dado motivoBloqueoPresupuesto definido, debe mostrar la alerta de presupuesto', () => {
    fixture.componentRef.setInput('motivoBloqueoPresupuesto', 'Superás el límite semanal');
    fixture.detectChanges();
    const alertas = fixture.debugElement.queryAll(By.css('.orden-alumno__alerta'));
    expect(alertas.length).toBeGreaterThan(0);
    const textos = alertas.map((a) => a.nativeElement.textContent as string);
    expect(textos.some((t) => t.includes('Superás el límite semanal'))).toBeTrue();
  });

  it('dado motivoBloqueoPresupuesto undefined, no debe mostrar la alerta', () => {
    fixture.componentRef.setInput('motivoBloqueoPresupuesto', undefined);
    fixture.detectChanges();
    const alertas = fixture.debugElement.queryAll(By.css('.orden-alumno__alerta'));
    expect(alertas.length).toBe(0);
  });

  // ── Template: modoSoloLectura ─────────────────────────────────────────────

  it('dado modoSoloLectura=true, debe mostrar el bloque de retiro en modo lectura', () => {
    fixture.componentRef.setInput('modoSoloLectura', true);
    fixture.detectChanges();
    const bloqueEditar = fixture.debugElement.query(By.css('.orden-alumno__retiro-lectura'));
    expect(bloqueEditar).not.toBeNull();
  });

  it('dado modoSoloLectura=false, debe mostrar los inputs de fecha y recreo', () => {
    fixture.componentRef.setInput('modoSoloLectura', false);
    fixture.detectChanges();
    const inputFecha = fixture.debugElement.query(By.css('input[type="date"]'));
    expect(inputFecha).not.toBeNull();
  });

  // ── Template: class seleccionado ─────────────────────────────────────────

  it('dado seleccionado=true, el article debe tener la clase --seleccionado', () => {
    fixture.componentRef.setInput('seleccionado', true);
    fixture.detectChanges();
    const article = fixture.debugElement.query(By.css('.orden-alumno--seleccionado'));
    expect(article).not.toBeNull();
  });

  it('dado seleccionado=false, el article NO debe tener la clase --seleccionado', () => {
    fixture.componentRef.setInput('seleccionado', false);
    fixture.detectChanges();
    const article = fixture.debugElement.query(By.css('.orden-alumno--seleccionado'));
    expect(article).toBeNull();
  });

  // ── @Output() toggleSeleccion ────────────────────────────────────────────

  it('dado un clic en el checkbox, debe emitir toggleSeleccion', () => {
    let emitido = false;
    componente.toggleSeleccion.subscribe(() => (emitido = true));
    const checkbox = fixture.debugElement.query(By.css('input[type="checkbox"]'));
    checkbox.nativeElement.dispatchEvent(new Event('change'));
    expect(emitido).toBeTrue();
  });

  // ── @Output() guardarFavorito ─────────────────────────────────────────────

  it('dado un clic en el botón guardar favorito, debe emitir guardarFavorito', () => {
    let emitido = false;
    componente.guardarFavorito.subscribe(() => (emitido = true));
    const boton = fixture.debugElement.query(By.css('.orden-alumno__favorito-btn'));
    boton.nativeElement.click();
    expect(emitido).toBeTrue();
  });

  // ── @Output() editarRetiro (sólo en modoSoloLectura) ────────────────────

  it('dado modoSoloLectura=true y clic en editar retiro, debe emitir editarRetiro', () => {
    fixture.componentRef.setInput('modoSoloLectura', true);
    fixture.detectChanges();
    let emitido = false;
    componente.editarRetiro.subscribe(() => (emitido = true));
    const boton = fixture.debugElement.query(By.css('.orden-alumno__retiro-editar'));
    boton.nativeElement.click();
    expect(emitido).toBeTrue();
  });

  // ── @Output() sumarItem, restarItem, eliminarItem ─────────────────────────

  it('dado que un carrito-item emite sumar, debe emitir sumarItem con el id', () => {
    let idEmitido: string | undefined;
    componente.sumarItem.subscribe((id: string) => (idEmitido = id));
    const carritoItem = fixture.debugElement.query(By.css('app-carrito-item'));
    carritoItem.triggerEventHandler('sumar', 'item-1');
    expect(idEmitido).toBe('item-1');
  });

  it('dado que un carrito-item emite restar, debe emitir restarItem con el id', () => {
    let idEmitido: string | undefined;
    componente.restarItem.subscribe((id: string) => (idEmitido = id));
    const carritoItem = fixture.debugElement.query(By.css('app-carrito-item'));
    carritoItem.triggerEventHandler('restar', 'item-1');
    expect(idEmitido).toBe('item-1');
  });

  it('dado que un carrito-item emite eliminar, debe emitir eliminarItem con el id', () => {
    let idEmitido: string | undefined;
    componente.eliminarItem.subscribe((id: string) => (idEmitido = id));
    const carritoItem = fixture.debugElement.query(By.css('app-carrito-item'));
    carritoItem.triggerEventHandler('eliminar', 'item-1');
    expect(idEmitido).toBe('item-1');
  });

  // ── Métodos protegidos: onFechaCambia / onRecreoCambia ────────────────────

  it('dado onFechaCambia, debe emitir fechaCambia con el valor del input', () => {
    let valorEmitido: string | undefined;
    componente.fechaCambia.subscribe((v: string) => (valorEmitido = v));

    const inputFecha = document.createElement('input');
    inputFecha.value = '2025-10-20';
    const evento = new Event('change');
    Object.defineProperty(evento, 'target', { value: inputFecha });

    (componente as unknown as { onFechaCambia: (e: Event) => void }).onFechaCambia(evento);
    expect(valorEmitido).toBe('2025-10-20');
  });

  it('dado onRecreoCambia, debe emitir recreoCambia con el valor del select', () => {
    let valorEmitido: string | undefined;
    componente.recreoCambia.subscribe((v: string) => (valorEmitido = v));

    const evento = { target: { value: 'SEGUNDO_RECREO' } } as unknown as Event;

    (componente as unknown as { onRecreoCambia: (e: Event) => void }).onRecreoCambia(evento);
    expect(valorEmitido).toBe('SEGUNDO_RECREO');
  });

  // ── Template: opciones de recreo con bloqueo ──────────────────────────────

  it('dado recreos con uno bloqueado por tiempo, debe mostrar la etiqueta de no disponible', () => {
    fixture.componentRef.setInput('modoSoloLectura', false);
    fixture.detectChanges();
    const opciones = fixture.debugElement.queryAll(By.css('select option'));
    const textos = opciones.map((o) => o.nativeElement.textContent as string);
    expect(textos.some((t) => t.includes('No disponible - Falta menos de 1 hora'))).toBeTrue();
  });
});
