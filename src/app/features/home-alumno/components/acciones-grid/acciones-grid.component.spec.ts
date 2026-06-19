import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AccionesGridComponent } from './acciones-grid.component';
import { AccionRapida } from '../../models/accion-rapida.model';

// ─── Datos de prueba ───────────────────────────────────────────────────────────

const accionUno: AccionRapida = {
  id: 'buffet',
  label: 'Buffet',
  descripcion: 'Comprá en el buffet',
  icono: 'fa-utensils',
  emoji: '🍔',
  color: 'menta',
  ruta: '/buffet',
};

const accionDos: AccionRapida = {
  id: 'pedidos',
  label: 'Pedidos',
  descripcion: 'Ver mis pedidos',
  icono: 'fa-bag-shopping',
  emoji: '🛒',
  color: 'dorado',
  ruta: '/pedidos',
};

// ─── Suite de pruebas ─────────────────────────────────────────────────────────

describe('AccionesGridComponent (home-alumno)', () => {
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

  it('dado que recibe un arreglo de acciones, debe renderizar tantos app-accion-tile como elementos', () => {
    const tiles = fixture.debugElement.queryAll(By.css('app-accion-tile'));
    expect(tiles.length).toBe(2);
  });

  it('dado que el arreglo de acciones está vacío, no debe renderizar ningún app-accion-tile', () => {
    fixture.componentRef.setInput('acciones', []);
    fixture.detectChanges();

    const tiles = fixture.debugElement.queryAll(By.css('app-accion-tile'));
    expect(tiles.length).toBe(0);
  });

  it('dado que se asigna un solo elemento a acciones, debe renderizar exactamente un app-accion-tile', () => {
    fixture.componentRef.setInput('acciones', [accionUno]);
    fixture.detectChanges();

    const tiles = fixture.debugElement.queryAll(By.css('app-accion-tile'));
    expect(tiles.length).toBe(1);
  });

  // ── onSeleccionar → @Output accion ────────────────────────────────────────

  it('dado que un tile emite el evento seleccionar, debe re-emitir el output "accion" con la accion correcta', () => {
    let accionEmitida: AccionRapida | undefined;
    componente.accion.subscribe((valor: AccionRapida) => (accionEmitida = valor));

    (componente as any).onSeleccionar(accionUno);

    expect(accionEmitida).toEqual(accionUno);
  });

  it('dado que onSeleccionar se llama con la segunda accion, debe emitir la segunda accion', () => {
    let accionEmitida: AccionRapida | undefined;
    componente.accion.subscribe((valor: AccionRapida) => (accionEmitida = valor));

    (componente as any).onSeleccionar(accionDos);

    expect(accionEmitida).toEqual(accionDos);
  });

  // ── Estructura del DOM ────────────────────────────────────────────────────

  it('dado que se renderiza, debe mostrar el título "¿Qué querés hacer hoy?"', () => {
    const titulo = fixture.debugElement.query(By.css('.acciones-grid__titulo'));
    expect(titulo.nativeElement.textContent).toContain('¿Qué querés hacer hoy?');
  });
});
