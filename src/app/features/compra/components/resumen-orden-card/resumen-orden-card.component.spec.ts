import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ResumenOrdenCardComponent, ResumenLinea } from './resumen-orden-card.component';

// ─── Datos de prueba ────────────────────────────────────────────────────────

const lineasMock: ResumenLinea[] = [
  { alumnoId: 'alumno-1', nombre: 'Lucas Díaz', subtotal: 1800, incluido: true },
  { alumnoId: 'alumno-2', nombre: 'Ana Torres', subtotal: 600, incluido: false },
];

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('ResumenOrdenCardComponent', () => {
  let componente: ResumenOrdenCardComponent;
  let fixture: ComponentFixture<ResumenOrdenCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumenOrdenCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumenOrdenCardComponent);
    componente = fixture.componentInstance;

    // Input requerido
    componente.lineas = lineasMock;
    componente.total = 2400;
    fixture.detectChanges();
  });

  // ── Creación ─────────────────────────────────────────────────────────────

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(componente).toBeTruthy();
  });

  // ── @Input() lineas ────────────────────────────────────────────────────────

  it('dado que recibe líneas, debe reflejarlas en lineasActuales', () => {
    expect(componente.lineasActuales().length).toBe(2);
  });

  it('dado que se actualizan las líneas, debe actualizar el signal', () => {
    const nuevasLineas: ResumenLinea[] = [
      { alumnoId: 'a-3', nombre: 'Pedro', subtotal: 300, incluido: true },
    ];
    fixture.componentRef.setInput('lineas', nuevasLineas);
    fixture.detectChanges();
    expect(componente.lineasActuales().length).toBe(1);
  });

  // ── @Input() total getter/setter ──────────────────────────────────────────

  it('dado total = 2400, el getter debe devolver 2400', () => {
    expect(componente.total).toBe(2400);
  });

  it('dado que se actualiza el total, debe reflejarse correctamente', () => {
    fixture.componentRef.setInput('total', 5000);
    fixture.detectChanges();
    expect(componente.total).toBe(5000);
  });

  // ── Computed: totalFormateado ─────────────────────────────────────────────

  it('dado total 2400, debe formatearlo con el separador de miles', () => {
    expect(componente.totalFormateado()).toContain('2.400');
  });

  it('dado total 0, debe formatearlo como $ 0', () => {
    fixture.componentRef.setInput('total', 0);
    fixture.detectChanges();
    expect(componente.totalFormateado()).toContain('0');
  });

  // ── Método: formatear ─────────────────────────────────────────────────────

  it('dado valor 1800, formatear debe retornar string con "1.800"', () => {
    expect(componente.formatear(1800)).toContain('1.800');
  });

  it('dado valor 0, formatear debe retornar string con "0"', () => {
    expect(componente.formatear(0)).toContain('0');
  });

  it('dado valor 999999, formatear debe retornar string con separadores correctos', () => {
    expect(componente.formatear(999999)).toContain('999.999');
  });

  // ── @Input() ctaLabel ─────────────────────────────────────────────────────

  it('dado ctaLabel por defecto, debe mostrar "Avanzar al Pago" en el botón', () => {
    const boton = fixture.debugElement.query(By.css('.resumen__cta'));
    expect(boton.nativeElement.textContent).toContain('Avanzar al Pago');
  });

  it('dado ctaLabel personalizado, debe mostrar el texto personalizado', () => {
    fixture.componentRef.setInput('ctaLabel', 'Confirmar pedido');
    fixture.detectChanges();
    const boton = fixture.debugElement.query(By.css('.resumen__cta'));
    expect(boton.nativeElement.textContent).toContain('Confirmar pedido');
  });

  // ── @Input() ctaDeshabilitado ─────────────────────────────────────────────

  it('dado ctaDeshabilitado=true, el botón debe estar deshabilitado', () => {
    fixture.componentRef.setInput('ctaDeshabilitado', true);
    fixture.detectChanges();
    const boton = fixture.debugElement.query(By.css('.resumen__cta')).nativeElement as HTMLButtonElement;
    expect(boton.disabled).toBeTrue();
  });

  it('dado ctaDeshabilitado=false y cargando=false, el botón debe estar habilitado', () => {
    fixture.componentRef.setInput('ctaDeshabilitado', false);
    fixture.componentRef.setInput('cargando', false);
    fixture.detectChanges();
    const boton = fixture.debugElement.query(By.css('.resumen__cta')).nativeElement as HTMLButtonElement;
    expect(boton.disabled).toBeFalse();
  });

  // ── @Input() cargando ─────────────────────────────────────────────────────

  it('dado cargando=true, el botón debe estar deshabilitado', () => {
    fixture.componentRef.setInput('cargando', true);
    fixture.detectChanges();
    const boton = fixture.debugElement.query(By.css('.resumen__cta')).nativeElement as HTMLButtonElement;
    expect(boton.disabled).toBeTrue();
  });

  it('dado cargando=true, debe mostrar el spinner', () => {
    fixture.componentRef.setInput('cargando', true);
    fixture.detectChanges();
    const spinner = fixture.debugElement.query(By.css('.fa-spinner'));
    expect(spinner).not.toBeNull();
  });

  it('dado cargando=false, debe mostrar el icono de candado (no spinner)', () => {
    fixture.componentRef.setInput('cargando', false);
    fixture.detectChanges();
    const spinner = fixture.debugElement.query(By.css('.fa-spinner'));
    const candado = fixture.debugElement.query(By.css('.fa-lock'));
    expect(spinner).toBeNull();
    expect(candado).not.toBeNull();
  });

  // ── @Input() advertencia ──────────────────────────────────────────────────

  it('dado advertencia=null, NO debe mostrar el párrafo de alerta', () => {
    fixture.componentRef.setInput('advertencia', null);
    fixture.detectChanges();
    const alerta = fixture.debugElement.query(By.css('.resumen__alerta'));
    expect(alerta).toBeNull();
  });

  it('dado advertencia con texto, debe mostrar el párrafo de alerta con ese texto', () => {
    fixture.componentRef.setInput('advertencia', 'Saldo insuficiente en uno de los alumnos');
    fixture.detectChanges();
    const alerta = fixture.debugElement.query(By.css('.resumen__alerta'));
    expect(alerta).not.toBeNull();
    expect(alerta.nativeElement.textContent).toContain('Saldo insuficiente en uno de los alumnos');
  });

  // ── @Output() accion ──────────────────────────────────────────────────────

  it('dado un clic en el botón CTA, debe emitir el evento accion', () => {
    fixture.componentRef.setInput('ctaDeshabilitado', false);
    fixture.componentRef.setInput('cargando', false);
    fixture.detectChanges();

    let emitido = false;
    componente.accion.subscribe(() => (emitido = true));
    const boton = fixture.debugElement.query(By.css('.resumen__cta'));
    boton.nativeElement.click();
    expect(emitido).toBeTrue();
  });

  // ── Template: listado de líneas ───────────────────────────────────────────

  it('dado líneas con datos, debe renderizar los <li> correctamente', () => {
    const items = fixture.debugElement.queryAll(By.css('.resumen__linea'));
    expect(items.length).toBe(2);
  });

  it('dado que la línea está excluida (incluido=false), debe tener la clase --excluida', () => {
    const items = fixture.debugElement.queryAll(By.css('.resumen__linea'));
    // La segunda línea (Ana Torres) tiene incluido=false
    const itemExcluido = items[1];
    expect(itemExcluido.classes['resumen__linea--excluida']).toBeTrue();
  });

  it('dado que la línea está incluida (incluido=true), NO debe tener la clase --excluida', () => {
    const items = fixture.debugElement.queryAll(By.css('.resumen__linea'));
    const itemIncluido = items[0];
    expect(itemIncluido.classes['resumen__linea--excluida']).toBeFalsy();
  });

  // ── Template: @empty cuando no hay líneas ────────────────────────────────

  it('dado líneas vacías, debe mostrar el mensaje de carrito vacío', () => {
    fixture.componentRef.setInput('lineas', []);
    fixture.detectChanges();
    const vacio = fixture.debugElement.query(By.css('.resumen__vacio'));
    expect(vacio).not.toBeNull();
    expect(vacio.nativeElement.textContent).toContain('vacío');
  });

  // ── Template: nombre y subtotal de cada línea ─────────────────────────────

  it('dado líneas con nombres, debe mostrar el nombre de cada alumno', () => {
    const nombres = fixture.debugElement.queryAll(By.css('.resumen__linea-nombre'));
    const textos = nombres.map((n) => n.nativeElement.textContent as string);
    expect(textos.some((t) => t.includes('Lucas Díaz'))).toBeTrue();
    expect(textos.some((t) => t.includes('Ana Torres'))).toBeTrue();
  });

  it('dado líneas con subtotales, debe mostrar el subtotal formateado de cada línea', () => {
    const valores = fixture.debugElement.queryAll(By.css('.resumen__linea-valor'));
    expect(valores[0].nativeElement.textContent).toContain('1.800');
    expect(valores[1].nativeElement.textContent).toContain('600');
  });
});
