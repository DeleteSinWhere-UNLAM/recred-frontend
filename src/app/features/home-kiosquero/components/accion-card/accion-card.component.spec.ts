import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AccionCardComponent } from './accion-card.component';
import { AccionKiosquero } from '../../models/accion-kiosquero.model';

// ─── Datos de prueba ───────────────────────────────────────────────────────────

const accionPizarra: AccionKiosquero = {
  id: 'ver-pedidos',
  titulo: 'Ver Pedidos',
  descripcion: 'Revisá los pedidos del día',
  icono: 'fa-clipboard-list',
  ruta: '/kiosquero/pedidos',
  color: 'pizarra',
  destacada: false,
};

const accionMenta: AccionKiosquero = {
  id: 'venta-espontanea',
  titulo: 'Venta Directa',
  descripcion: 'Cobrá en el momento',
  icono: 'fa-cash-register',
  ruta: '/kiosquero/venta',
  color: 'menta',
  destacada: true,
};

const accionSinColor: AccionKiosquero = {
  id: 'stock',
  titulo: 'Stock',
  descripcion: 'Gestión de inventario',
  icono: 'fa-boxes-stacked',
  ruta: '/kiosquero/stock',
};

// ─── Suite de pruebas ─────────────────────────────────────────────────────────

describe('AccionCardComponent (home-kiosquero)', () => {
  let componente: AccionCardComponent;
  let fixture: ComponentFixture<AccionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccionCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccionCardComponent);
    componente = fixture.componentInstance;
    componente.accion = accionPizarra;
    fixture.detectChanges();
  });

  // ── Creación ──────────────────────────────────────────────────────────────

  it('dado que se inicializa con una accion válida, debe crearse correctamente', () => {
    expect(componente).toBeTruthy();
  });

  // ── @Input: accion → contenido ────────────────────────────────────────────

  it('dado que recibe una accion, debe mostrar el título en el DOM', () => {
    const titulo = fixture.debugElement.query(By.css('.accion-card__titulo'));
    expect(titulo.nativeElement.textContent).toContain('Ver Pedidos');
  });

  it('dado que recibe una accion, debe mostrar la descripción en el DOM', () => {
    const descripcion = fixture.debugElement.query(By.css('.accion-card__descripcion'));
    expect(descripcion.nativeElement.textContent).toContain('Revisá los pedidos del día');
  });

  it('dado que recibe una accion, el botón debe tener el aria-label compuesto', () => {
    const boton = fixture.debugElement.query(By.css('button'));
    expect(boton.nativeElement.getAttribute('aria-label')).toBe('Ver Pedidos: Revisá los pedidos del día');
  });

  // ── Clases de color ───────────────────────────────────────────────────────

  it('dado que la accion tiene color "pizarra", debe aplicar la clase accion-card--pizarra', () => {
    const boton = fixture.debugElement.query(By.css('button'));
    expect(boton.nativeElement.classList).toContain('accion-card--pizarra');
  });

  it('dado que la accion tiene color "menta", debe aplicar la clase accion-card--menta', () => {
    fixture.componentRef.setInput('accion', accionMenta);
    fixture.detectChanges();

    const boton = fixture.debugElement.query(By.css('button'));
    expect(boton.nativeElement.classList).toContain('accion-card--menta');
  });

  it('dado que la accion no tiene color definido, NO debe aplicar ninguna clase de color', () => {
    fixture.componentRef.setInput('accion', accionSinColor);
    fixture.detectChanges();

    const boton = fixture.debugElement.query(By.css('button'));
    expect(boton.nativeElement.classList).not.toContain('accion-card--pizarra');
    expect(boton.nativeElement.classList).not.toContain('accion-card--menta');
  });

  // ── onClick → @Output seleccionar ─────────────────────────────────────────

  it('dado que se hace click en el botón, debe emitir el output "seleccionar" con la accion', () => {
    let accionEmitida: AccionKiosquero | undefined;
    componente.seleccionar.subscribe((valor: AccionKiosquero) => (accionEmitida = valor));

    const boton = fixture.debugElement.query(By.css('button'));
    boton.triggerEventHandler('click', null);

    expect(accionEmitida).toEqual(accionPizarra);
  });

  it('dado que se hace click con una accion "menta", debe emitir esa accion', () => {
    fixture.componentRef.setInput('accion', accionMenta);
    fixture.detectChanges();

    let accionEmitida: AccionKiosquero | undefined;
    componente.seleccionar.subscribe((valor: AccionKiosquero) => (accionEmitida = valor));

    const boton = fixture.debugElement.query(By.css('button'));
    boton.triggerEventHandler('click', null);

    expect(accionEmitida).toEqual(accionMenta);
  });
});
