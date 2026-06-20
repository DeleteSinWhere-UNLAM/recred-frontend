import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AccionTileComponent } from './accion-tile.component';
import { AccionRapida } from '../../models/accion-rapida.model';

// ─── Datos de prueba ───────────────────────────────────────────────────────────

const accionConRuta: AccionRapida = {
  id: 'buffet',
  label: 'Ir al Buffet',
  descripcion: 'Comprá tu merienda',
  icono: 'fa-utensils',
  emoji: '🍔',
  color: 'menta',
  ruta: '/buffet',
};

const accionSinRuta: AccionRapida = {
  id: 'favoritos',
  label: 'Favoritos',
  descripcion: 'Próximamente',
  icono: 'fa-star',
  emoji: '⭐',
  color: 'pizarra',
  ruta: null,
};

// ─── Suite de pruebas ─────────────────────────────────────────────────────────

describe('AccionTileComponent', () => {
  let componente: AccionTileComponent;
  let fixture: ComponentFixture<AccionTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccionTileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccionTileComponent);
    componente = fixture.componentInstance;
    componente.accion = accionConRuta;
    fixture.detectChanges();
  });

  // ── Creación ──────────────────────────────────────────────────────────────

  it('dado que se inicializa con accion válida, debe crearse correctamente', () => {
    expect(componente).toBeTruthy();
  });

  // ── @Input: accion ────────────────────────────────────────────────────────

  it('dado que recibe una accion con ruta, debe renderizar el label en el DOM', () => {
    const etiqueta = fixture.debugElement.query(By.css('.accion-tile__label'));
    expect(etiqueta.nativeElement.textContent).toContain('Ir al Buffet');
  });

  it('dado que recibe una accion con ruta, debe renderizar la descripcion en el DOM', () => {
    const descripcion = fixture.debugElement.query(By.css('.accion-tile__descripcion'));
    expect(descripcion.nativeElement.textContent).toContain('Comprá tu merienda');
  });

  // ── get colorClass ────────────────────────────────────────────────────────

  it('dado que la accion tiene color "menta", debe aplicar la clase accion-tile--menta al botón', () => {
    const boton = fixture.debugElement.query(By.css('button'));
    expect(boton.nativeElement.classList).toContain('accion-tile--menta');
  });

  it('dado que la accion tiene color "pizarra", debe aplicar la clase accion-tile--pizarra al botón', () => {
    fixture.componentRef.setInput('accion', accionSinRuta);
    fixture.detectChanges();

    const boton = fixture.debugElement.query(By.css('button'));
    expect(boton.nativeElement.classList).toContain('accion-tile--pizarra');
  });

  // ── get esPlaceholder ─────────────────────────────────────────────────────

  it('dado que la accion tiene ruta válida, esPlaceholder debe retornar false', () => {
    expect((componente as any).esPlaceholder).toBeFalse();
  });

  it('dado que la accion tiene ruta null, esPlaceholder debe retornar true', () => {
    fixture.componentRef.setInput('accion', accionSinRuta);
    fixture.detectChanges();

    expect((componente as any).esPlaceholder).toBeTrue();
  });

  // ── @if (esPlaceholder) → badge "Próximamente" ───────────────────────────

  it('dado que esPlaceholder es true, debe mostrar el badge "Próximamente" en el DOM', () => {
    fixture.componentRef.setInput('accion', accionSinRuta);
    fixture.detectChanges();

    const badge = fixture.debugElement.query(By.css('.accion-tile__badge'));
    expect(badge).not.toBeNull();
    expect(badge.nativeElement.textContent).toContain('Próximamente');
  });

  it('dado que esPlaceholder es false, NO debe mostrar el badge "Próximamente"', () => {
    const badge = fixture.debugElement.query(By.css('.accion-tile__badge'));
    expect(badge).toBeNull();
  });

  // ── onClick → @Output seleccionar ─────────────────────────────────────────

  it('dado que se hace click en el botón, debe emitir el output "seleccionar" con la accion', () => {
    let accionEmitida: AccionRapida | undefined;
    componente.seleccionar.subscribe((valor: AccionRapida) => (accionEmitida = valor));

    const boton = fixture.debugElement.query(By.css('button'));
    boton.triggerEventHandler('click', null);

    expect(accionEmitida).toEqual(accionConRuta);
  });

  it('dado que se hace click con una accion placeholder, debe emitir la accion sin ruta', () => {
    fixture.componentRef.setInput('accion', accionSinRuta);
    fixture.detectChanges();

    let accionEmitida: AccionRapida | undefined;
    componente.seleccionar.subscribe((valor: AccionRapida) => (accionEmitida = valor));

    const boton = fixture.debugElement.query(By.css('button'));
    boton.triggerEventHandler('click', null);

    expect(accionEmitida).toEqual(accionSinRuta);
  });

  // ── aria-label ────────────────────────────────────────────────────────────

  it('dado que recibe una accion, el botón debe tener el aria-label correcto', () => {
    const boton = fixture.debugElement.query(By.css('button'));
    expect(boton.nativeElement.getAttribute('aria-label')).toBe('Ir al Buffet');
  });
});
