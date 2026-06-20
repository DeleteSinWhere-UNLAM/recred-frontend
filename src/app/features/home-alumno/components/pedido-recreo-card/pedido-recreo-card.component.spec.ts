import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PedidoRecreoCardComponent } from './pedido-recreo-card.component';
import { PedidoEnCurso } from '../../models/pedido-en-curso.model';
import { Recreo } from '../../models/recreo.model';

// ─── Datos de prueba ───────────────────────────────────────────────────────────

const pedidoEjemplo: PedidoEnCurso = {
  id: 'pedido-1',
  estado: 'PREPARANDO',
  itemsResumen: ['Empanada de carne', 'Jugo de naranja'],
  totalFormateado: '$1.200',
  retiraEn: '10 minutos',
};

const recreoEjemplo: Recreo = {
  nombre: 'Recreo grande',
  horaInicio: '10:30',
  horaFin: '10:50',
};

// ─── Suite de pruebas ─────────────────────────────────────────────────────────

describe('PedidoRecreoCardComponent', () => {
  let componente: PedidoRecreoCardComponent;
  let fixture: ComponentFixture<PedidoRecreoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidoRecreoCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PedidoRecreoCardComponent);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('estadoLabel', 'En preparación');
    fixture.componentRef.setInput('iconoEstado', 'fa-fire');
    fixture.detectChanges();
  });

  // ── Creación ──────────────────────────────────────────────────────────────

  it('dado que se inicializa con inputs requeridos, debe crearse correctamente', () => {
    expect(componente).toBeTruthy();
  });

  // ── @Input: estadoLabel e iconoEstado ─────────────────────────────────────

  it('dado que se provee estadoLabel, debe mostrarlo en el título del pedido', () => {
    const titulo = fixture.debugElement.query(By.css('.pedido-recreo__titulo'));
    expect(titulo.nativeElement.textContent).toContain('En preparación');
  });

  // ── get tienePedido ───────────────────────────────────────────────────────

  it('dado que pedido es undefined, tienePedido debe retornar false', () => {
    fixture.componentRef.setInput('pedido', undefined);
    fixture.detectChanges();

    expect((componente as any).tienePedido).toBeFalse();
  });

  it('dado que pedido tiene valor, tienePedido debe retornar true', () => {
    fixture.componentRef.setInput('pedido', pedidoEjemplo);
    fixture.detectChanges();

    expect((componente as any).tienePedido).toBeTrue();
  });

  // ── @if (tienePedido && pedido) → rama CON pedido ─────────────────────────

  it('dado que hay pedido, debe renderizar los items del resumen como chips', () => {
    fixture.componentRef.setInput('pedido', pedidoEjemplo);
    fixture.detectChanges();

    const chips = fixture.debugElement.queryAll(By.css('.pedido-recreo__chip'));
    expect(chips.length).toBe(2);
    expect(chips[0].nativeElement.textContent).toContain('Empanada de carne');
    expect(chips[1].nativeElement.textContent).toContain('Jugo de naranja');
  });

  it('dado que hay pedido, debe mostrar el total formateado', () => {
    fixture.componentRef.setInput('pedido', pedidoEjemplo);
    fixture.detectChanges();

    const totalValor = fixture.debugElement.query(By.css('.pedido-recreo__total-valor'));
    expect(totalValor.nativeElement.textContent).toContain('$1.200');
  });

  it('dado que hay pedido, debe mostrar el tiempo de retiro', () => {
    fixture.componentRef.setInput('pedido', pedidoEjemplo);
    fixture.detectChanges();

    const retira = fixture.debugElement.query(By.css('.pedido-recreo__retira span'));
    expect(retira.nativeElement.textContent).toContain('10 minutos');
  });

  it('dado que hay pedido, el botón CTA debe decir "Ver mi pedido"', () => {
    fixture.componentRef.setInput('pedido', pedidoEjemplo);
    fixture.detectChanges();

    const cta = fixture.debugElement.query(By.css('.pedido-recreo__cta'));
    expect(cta.nativeElement.textContent).toContain('Ver mi pedido');
  });

  // ── @if (tienePedido && pedido) → rama SIN pedido ─────────────────────────

  it('dado que no hay pedido, debe mostrar el mensaje de estado vacío', () => {
    fixture.componentRef.setInput('pedido', undefined);
    fixture.detectChanges();

    const vacio = fixture.debugElement.query(By.css('.pedido-recreo__vacio'));
    expect(vacio).not.toBeNull();
    expect(vacio.nativeElement.textContent).toContain('Todavía no pediste nada');
  });

  it('dado que no hay pedido, el botón CTA debe decir "Ir al buffet"', () => {
    fixture.componentRef.setInput('pedido', undefined);
    fixture.detectChanges();

    const cta = fixture.debugElement.query(By.css('.pedido-recreo__cta'));
    expect(cta.nativeElement.textContent).toContain('Ir al buffet');
  });

  // ── @if (recreo) → rama CON recreo ────────────────────────────────────────

  it('dado que hay recreo, debe mostrar su nombre', () => {
    fixture.componentRef.setInput('recreo', recreoEjemplo);
    fixture.detectChanges();

    const titulosRecreo = fixture.debugElement.queryAll(By.css('.pedido-recreo__titulo'));
    const tituloRecreoEl = titulosRecreo[1];
    expect(tituloRecreoEl.nativeElement.textContent).toContain('Recreo grande');
  });

  it('dado que hay recreo, debe mostrar horaInicio y horaFin en el horario', () => {
    fixture.componentRef.setInput('recreo', recreoEjemplo);
    fixture.detectChanges();

    const horas = fixture.debugElement.queryAll(By.css('.pedido-recreo__hora'));
    expect(horas[0].nativeElement.textContent).toContain('10:30');
    expect(horas[1].nativeElement.textContent).toContain('10:50');
  });

  // ── @if (recreo) → rama SIN recreo ────────────────────────────────────────

  it('dado que no hay recreo, debe mostrar "Sin recreo a la vista"', () => {
    fixture.componentRef.setInput('recreo', undefined);
    fixture.detectChanges();

    const titulosRecreo = fixture.debugElement.queryAll(By.css('.pedido-recreo__titulo'));
    // El segundo h3 corresponde al bloque recreo
    expect(titulosRecreo[1].nativeElement.textContent).toContain('Sin recreo a la vista');
  });

  it('dado que no hay recreo, NO debe renderizar el bloque de horario', () => {
    fixture.componentRef.setInput('recreo', undefined);
    fixture.detectChanges();

    const horario = fixture.debugElement.query(By.css('.pedido-recreo__horario'));
    expect(horario).toBeNull();
  });

  // ── onCta → @Output verPedido ─────────────────────────────────────────────

  it('dado que se hace click en el CTA sin pedido, debe emitir el output verPedido', () => {
    fixture.componentRef.setInput('pedido', undefined);
    fixture.detectChanges();

    let emitido = false;
    componente.verPedido.subscribe(() => (emitido = true));

    const cta = fixture.debugElement.query(By.css('.pedido-recreo__cta'));
    cta.triggerEventHandler('click', null);

    expect(emitido).toBeTrue();
  });

  it('dado que se hace click en el CTA con pedido, debe emitir el output verPedido', () => {
    fixture.componentRef.setInput('pedido', pedidoEjemplo);
    fixture.detectChanges();

    let emitido = false;
    componente.verPedido.subscribe(() => (emitido = true));

    const cta = fixture.debugElement.query(By.css('.pedido-recreo__cta'));
    cta.triggerEventHandler('click', null);

    expect(emitido).toBeTrue();
  });
});
