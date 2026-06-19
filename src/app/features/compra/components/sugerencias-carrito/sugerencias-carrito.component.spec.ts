import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SugerenciasCarritoComponent } from './sugerencias-carrito.component';
import {
  SugerenciaCarrito,
  OrigenSugerenciaCarrito,
} from '../../models/sugerencia-carrito.model';

// ─── Datos de prueba ────────────────────────────────────────────────────────

const crearSugerencia = (
  id: string,
  source: OrigenSugerenciaCarrito,
  precio = 300
): SugerenciaCarrito => ({
  productId: id,
  productName: `Producto ${id}`,
  price: precio,
  stockActual: 5,
  reason: `Razón para ${id}`,
  source,
  score: 0.9,
});

const sugerenciasFavorito = crearSugerencia('s-1', 'FAVORITE', 500);
const sugerenciaHistorial = crearSugerencia('s-2', 'PURCHASE_HISTORY', 250);
const sugerenciaPreferencia = crearSugerencia('s-3', 'DETECTED_PREFERENCE', 400);
const sugerenciaDiaPatron = crearSugerencia('s-4', 'DAY_PATTERN', 300);
const sugerenciaAfinidadAlumno = crearSugerencia('s-5', 'STUDENT_CART_AFFINITY', 150);
const sugerenciaAfinidadBuffet = crearSugerencia('s-6', 'BUFFET_CART_AFFINITY', 200);

const todasLasSugerencias: SugerenciaCarrito[] = [
  sugerenciasFavorito,
  sugerenciaHistorial,
  sugerenciaPreferencia,
  sugerenciaDiaPatron,
  sugerenciaAfinidadAlumno,
  sugerenciaAfinidadBuffet,
];

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('SugerenciasCarritoComponent', () => {
  let componente: SugerenciasCarritoComponent;
  let fixture: ComponentFixture<SugerenciasCarritoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SugerenciasCarritoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SugerenciasCarritoComponent);
    componente = fixture.componentInstance;

    componente.sugerencias = [sugerenciasFavorito, sugerenciaHistorial];
    componente.cargando = false;
    fixture.detectChanges();
  });

  // ── Creación ─────────────────────────────────────────────────────────────

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(componente).toBeTruthy();
  });

  // ── @Input() sugerencias ──────────────────────────────────────────────────

  it('dado una lista de sugerencias, hayResultados debe ser true', () => {
    expect(componente.hayResultados()).toBeTrue();
  });

  it('dado una lista vacía de sugerencias, hayResultados debe ser false', () => {
    componente.sugerencias = [];
    fixture.detectChanges();
    expect(componente.hayResultados()).toBeFalse();
  });

  it('dado null como sugerencias (valor defensivo), debe manejarlo sin error', () => {
    // El setter hace ?? []
    componente.sugerencias = null as unknown as SugerenciaCarrito[];
    fixture.detectChanges();
    expect(componente.hayResultados()).toBeFalse();
  });

  // ── @Input() cargando ─────────────────────────────────────────────────────

  it('dado cargando=true, estaCargando debe ser true', () => {
    componente.cargando = true;
    fixture.detectChanges();
    expect(componente.estaCargando()).toBeTrue();
  });

  it('dado cargando=false, estaCargando debe ser false', () => {
    componente.cargando = false;
    fixture.detectChanges();
    expect(componente.estaCargando()).toBeFalse();
  });

  it('dado un valor truthy, el setter debe convertir el cargando a boolean', () => {
    componente.cargando = true;
    fixture.detectChanges();
    expect(componente.estaCargando()).toBeTrue();
  });

  // ── Computed: vistas ──────────────────────────────────────────────────────

  it('dado sugerencias, vistas debe tener la misma longitud', () => {
    expect(componente.vistas().length).toBe(2);
  });

  it('dado una sugerencia FAVORITE, la etiqueta debe ser "Favorito" y el icono fa-heart', () => {
    componente.sugerencias = [sugerenciasFavorito];
    fixture.detectChanges();
    const vista = componente.vistas()[0];
    expect(vista.etiqueta).toBe('Favorito');
    expect(vista.icono).toBe('fa-heart');
    expect(vista.colorClass).toContain('melocoton');
  });

  it('dado una sugerencia PURCHASE_HISTORY, la etiqueta debe ser "Frecuente"', () => {
    componente.sugerencias = [sugerenciaHistorial];
    fixture.detectChanges();
    const vista = componente.vistas()[0];
    expect(vista.etiqueta).toBe('Frecuente');
    expect(vista.icono).toBe('fa-arrows-rotate');
    expect(vista.colorClass).toContain('pizarra');
  });

  it('dado una sugerencia DETECTED_PREFERENCE, la etiqueta debe ser "Preferencia"', () => {
    componente.sugerencias = [sugerenciaPreferencia];
    fixture.detectChanges();
    expect(componente.vistas()[0].etiqueta).toBe('Preferencia');
  });

  it('dado una sugerencia DAY_PATTERN, la etiqueta debe ser "Te puede gustar hoy"', () => {
    componente.sugerencias = [sugerenciaDiaPatron];
    fixture.detectChanges();
    expect(componente.vistas()[0].etiqueta).toBe('Te puede gustar hoy');
  });

  it('dado una sugerencia STUDENT_CART_AFFINITY, la etiqueta debe ser "Suele acompañar tu carrito"', () => {
    componente.sugerencias = [sugerenciaAfinidadAlumno];
    fixture.detectChanges();
    const vista = componente.vistas()[0];
    expect(vista.etiqueta).toBe('Suele acompañar tu carrito');
    expect(vista.colorClass).toContain('menta');
  });

  it('dado una sugerencia BUFFET_CART_AFFINITY, la etiqueta debe ser "Combo frecuente"', () => {
    componente.sugerencias = [sugerenciaAfinidadBuffet];
    fixture.detectChanges();
    expect(componente.vistas()[0].etiqueta).toBe('Combo frecuente');
  });

  it('dado un source desconocido, debe usar etiqueta fallback "Sugerido"', () => {
    const sugerenciaDesconocida = crearSugerencia('s-x', 'UNKNOWN_SOURCE' as OrigenSugerenciaCarrito);
    componente.sugerencias = [sugerenciaDesconocida];
    fixture.detectChanges();
    expect(componente.vistas()[0].etiqueta).toBe('Sugerido');
  });

  it('dado una sugerencia con precio 500, el precioFormateado debe contener "500"', () => {
    componente.sugerencias = [sugerenciasFavorito];
    fixture.detectChanges();
    expect(componente.vistas()[0].precioFormateado).toContain('500');
  });

  // ── Método protegido: onAgregar ───────────────────────────────────────────

  it('dado onAgregar, debe emitir el evento agregar con la sugerencia correcta', () => {
    let emitido: SugerenciaCarrito | undefined;
    componente.agregar.subscribe((s: SugerenciaCarrito) => (emitido = s));

    (componente as unknown as { onAgregar: (s: SugerenciaCarrito) => void }).onAgregar(sugerenciasFavorito);

    expect(emitido).toEqual(sugerenciasFavorito);
  });

  // ── Template: estado cargando ─────────────────────────────────────────────

  it('dado cargando=true, debe mostrar el párrafo de cargando', () => {
    componente.cargando = true;
    fixture.detectChanges();
    const cargando = fixture.debugElement.query(By.css('.sugerencias-carrito__cargando'));
    expect(cargando).not.toBeNull();
    expect(cargando.nativeElement.textContent).toContain('Buscando sugerencias');
  });

  it('dado cargando=true, NO debe mostrar ni la lista ni el mensaje vacío', () => {
    componente.cargando = true;
    fixture.detectChanges();
    const lista = fixture.debugElement.query(By.css('.sugerencias-carrito__lista'));
    const vacio = fixture.debugElement.query(By.css('.sugerencias-carrito__vacio'));
    expect(lista).toBeNull();
    expect(vacio).toBeNull();
  });

  // ── Template: estado con resultados ──────────────────────────────────────

  it('dado cargando=false y hay sugerencias, debe mostrar la lista', () => {
    const lista = fixture.debugElement.query(By.css('.sugerencias-carrito__lista'));
    expect(lista).not.toBeNull();
  });

  it('dado sugerencias cargadas, debe renderizar un <li> por cada sugerencia', () => {
    componente.sugerencias = todasLasSugerencias;
    fixture.detectChanges();
    const items = fixture.debugElement.queryAll(By.css('.sugerencias-carrito__item'));
    expect(items.length).toBe(6);
  });

  // ── Template: estado vacío ────────────────────────────────────────────────

  it('dado cargando=false y sin sugerencias, debe mostrar el mensaje vacío', () => {
    componente.sugerencias = [];
    fixture.detectChanges();
    const vacio = fixture.debugElement.query(By.css('.sugerencias-carrito__vacio'));
    expect(vacio).not.toBeNull();
    expect(vacio.nativeElement.textContent).toContain('Sin sugerencias');
  });

  it('dado estado vacío, NO debe mostrar la lista ni el spinner de carga', () => {
    componente.sugerencias = [];
    fixture.detectChanges();
    const lista = fixture.debugElement.query(By.css('.sugerencias-carrito__lista'));
    const cargando = fixture.debugElement.query(By.css('.sugerencias-carrito__cargando'));
    expect(lista).toBeNull();
    expect(cargando).toBeNull();
  });

  // ── Template: clic en botón "Agregar" ────────────────────────────────────

  it('dado un clic en el botón agregar, debe emitir el evento agregar con la sugerencia correspondiente', () => {
    componente.sugerencias = [sugerenciasFavorito];
    fixture.detectChanges();

    let emitido: SugerenciaCarrito | undefined;
    componente.agregar.subscribe((s: SugerenciaCarrito) => (emitido = s));

    const boton = fixture.debugElement.query(By.css('.sugerencias-carrito__cta'));
    boton.nativeElement.click();

    expect(emitido).toEqual(sugerenciasFavorito);
  });

  // ── Template: nombre y razón mostrados ───────────────────────────────────

  it('dado una sugerencia, debe mostrar el nombre del producto en el template', () => {
    componente.sugerencias = [sugerenciasFavorito];
    fixture.detectChanges();
    const nombre = fixture.debugElement.query(By.css('.sugerencias-carrito__nombre'));
    expect(nombre.nativeElement.textContent.trim()).toContain('Producto s-1');
  });

  it('dado una sugerencia, debe mostrar la razón en el template', () => {
    componente.sugerencias = [sugerenciasFavorito];
    fixture.detectChanges();
    const razon = fixture.debugElement.query(By.css('.sugerencias-carrito__razon'));
    expect(razon.nativeElement.textContent.trim()).toContain('Razón para s-1');
  });

  // ── Todos los sources cubiertos ───────────────────────────────────────────

  const casosEtiqueta: Array<[OrigenSugerenciaCarrito, string]> = [
    ['FAVORITE', 'Favorito'],
    ['DETECTED_PREFERENCE', 'Preferencia'],
    ['PURCHASE_HISTORY', 'Frecuente'],
    ['DAY_PATTERN', 'Te puede gustar hoy'],
    ['STUDENT_CART_AFFINITY', 'Suele acompañar tu carrito'],
    ['BUFFET_CART_AFFINITY', 'Combo frecuente'],
  ];

  casosEtiqueta.forEach(([source, etiquetaEsperada]) => {
    it(`dado source "${source}", debe generar la etiqueta "${etiquetaEsperada}"`, () => {
      componente.sugerencias = [crearSugerencia(`${source}-test`, source)];
      fixture.detectChanges();
      expect(componente.vistas()[0].etiqueta).toBe(etiquetaEsperada);
    });
  });
});
