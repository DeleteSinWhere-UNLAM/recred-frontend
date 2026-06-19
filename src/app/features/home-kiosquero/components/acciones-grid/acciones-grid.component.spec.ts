import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AccionesGridComponent } from './acciones-grid.component';
import { AccionKiosquero } from '../../models/accion-kiosquero.model';

// ─── Datos de prueba ───────────────────────────────────────────────────────────

const accionUno: AccionKiosquero = {
  id: 'ver-pedidos',
  titulo: 'Ver Pedidos',
  descripcion: 'Pedidos del día',
  icono: 'fa-clipboard-list',
  ruta: '/kiosquero/pedidos',
  color: 'pizarra',
  destacada: false,
};

const accionDos: AccionKiosquero = {
  id: 'venta-espontanea',
  titulo: 'Venta Directa',
  descripcion: 'Cobrá en el momento',
  icono: 'fa-cash-register',
  ruta: '/kiosquero/venta',
  color: 'menta',
  destacada: true,
};

// ─── Suite de pruebas ─────────────────────────────────────────────────────────

describe('AccionesGridComponent (home-kiosquero)', () => {
  let componente: AccionesGridComponent;
  let fixture: ComponentFixture<AccionesGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccionesGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccionesGridComponent);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('acciones', [accionUno, accionDos]);
    fixture.detectChanges();
  });

  // ── Creación ──────────────────────────────────────────────────────────────

  it('dado que se inicializa con acciones válidas, debe crearse correctamente', () => {
    expect(componente).toBeTruthy();
  });

  // ── @Input: acciones ──────────────────────────────────────────────────────

  it('dado que recibe un arreglo de acciones, debe renderizar tantos app-accion-card como elementos', () => {
    const cards = fixture.debugElement.queryAll(By.css('app-accion-card'));
    expect(cards.length).toBe(2);
  });

  it('dado que el arreglo de acciones está vacío, no debe renderizar ningún app-accion-card', () => {
    fixture.componentRef.setInput('acciones', []);
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('app-accion-card'));
    expect(cards.length).toBe(0);
  });

  it('dado que se asigna un solo elemento a acciones, debe renderizar exactamente un app-accion-card', () => {
    fixture.componentRef.setInput('acciones', [accionUno]);
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.css('app-accion-card'));
    expect(cards.length).toBe(1);
  });

  // ── accion.destacada → clase --full ───────────────────────────────────────

  it('dado que una accion es destacada, su contenedor debe tener la clase acciones-grid__item--full', () => {
    const items = fixture.debugElement.queryAll(By.css('.acciones-grid__item--full'));
    // accionDos tiene destacada: true
    expect(items.length).toBe(1);
  });

  // ── onSeleccionar → @Output accion ────────────────────────────────────────

  it('dado que un card emite el evento seleccionar, debe re-emitir el output "accion" con la accion correcta', () => {
    let accionEmitida: AccionKiosquero | undefined;
    componente.accion.subscribe((valor: AccionKiosquero) => (accionEmitida = valor));

    (componente as any).onSeleccionar(accionUno);

    expect(accionEmitida).toEqual(accionUno);
  });

  it('dado que onSeleccionar se llama con la accion destacada, debe emitir esa accion', () => {
    let accionEmitida: AccionKiosquero | undefined;
    componente.accion.subscribe((valor: AccionKiosquero) => (accionEmitida = valor));

    (componente as any).onSeleccionar(accionDos);

    expect(accionEmitida).toEqual(accionDos);
  });

  // ── Estructura del DOM ────────────────────────────────────────────────────

  it('dado que se renderiza, debe mostrar el título "Tus herramientas"', () => {
    const titulo = fixture.debugElement.query(By.css('.acciones-grid__titulo'));
    expect(titulo.nativeElement.textContent).toContain('Tus herramientas');
  });
});
