import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { PerfilKiosqueroHeaderComponent } from './perfil-kiosquero-header.component';

// ─── Suite de pruebas ─────────────────────────────────────────────────────────

describe('PerfilKiosqueroHeaderComponent', () => {
  let componente: PerfilKiosqueroHeaderComponent;
  let fixture: ComponentFixture<PerfilKiosqueroHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilKiosqueroHeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilKiosqueroHeaderComponent);
    componente = fixture.componentInstance;

    // Inputs requeridos
    componente.iniciales = 'MG';
    componente.nombreKiosquero = 'María García';
    componente.saludo = '¡Buenas tardes!';
    componente.gananciasFormateadas = '$15.000';
    componente.ventasHoy = 42;
    componente.productosSinStock = 0;
    fixture.detectChanges();
  });

  // ── Creación ──────────────────────────────────────────────────────────────

  it('dado que se inicializa con todos los inputs requeridos, debe crearse correctamente', () => {
    expect(componente).toBeTruthy();
  });

  // ── @Input: iniciales ─────────────────────────────────────────────────────

  it('dado que recibe iniciales, debe mostrarlas en el avatar', () => {
    const avatar = fixture.debugElement.query(By.css('.perfil-kiosquero-header__avatar span'));
    expect(avatar.nativeElement.textContent).toContain('MG');
  });

  // ── @Input: nombreKiosquero ────────────────────────────────────────────────

  it('dado que recibe nombreKiosquero, debe mostrarlo en el h1', () => {
    const nombre = fixture.debugElement.query(By.css('.perfil-kiosquero-header__nombre'));
    expect(nombre.nativeElement.textContent).toContain('María García');
  });

  it('dado que recibe nombreKiosquero, debe incluirlo en el aria-label de la sección', () => {
    const seccion = fixture.debugElement.query(By.css('.perfil-kiosquero-header'));
    expect(seccion.nativeElement.getAttribute('aria-label')).toBe('Perfil de María García');
  });

  // ── @Input: gananciasFormateadas ──────────────────────────────────────────

  it('dado que recibe gananciasFormateadas, debe mostrarlas en el stat correspondiente', () => {
    const statValores = fixture.debugElement.queryAll(By.css('.perfil-kiosquero-header__stat-valor'));
    // Primer stat-valor = ganancias
    expect(statValores[0].nativeElement.textContent).toContain('$15.000');
  });

  // ── @Input: ventasHoy ─────────────────────────────────────────────────────

  it('dado que recibe ventasHoy, debe mostrar el número en el stat de ventas', () => {
    const statValores = fixture.debugElement.queryAll(By.css('.perfil-kiosquero-header__stat-valor'));
    // Segundo stat-valor = ventasHoy
    expect(statValores[1].nativeElement.textContent).toContain('42');
  });

  // ── @Input: pedidosPendientes ─────────────────────────────────────────────

  it('dado que pedidosPendientes es 0 (por defecto), NO debe aplicar la clase --alerta al link de pedidos', () => {
    const linkPedidos = fixture.debugElement.query(
      By.css('.perfil-kiosquero-header__stat--link')
    );
    expect(linkPedidos.nativeElement.classList).not.toContain(
      'perfil-kiosquero-header__stat--alerta'
    );
  });

  it('dado que pedidosPendientes es mayor a 0, debe aplicar la clase --alerta al link de pedidos', () => {
    fixture.componentRef.setInput('pedidosPendientes', 5);
    fixture.detectChanges();

    const linkPedidos = fixture.debugElement.query(
      By.css('.perfil-kiosquero-header__stat--link')
    );
    expect(linkPedidos.nativeElement.classList).toContain(
      'perfil-kiosquero-header__stat--alerta'
    );
  });

  it('dado que pedidosPendientes es mayor a 0, debe mostrar el número en el stat de pedidos', () => {
    fixture.componentRef.setInput('pedidosPendientes', 7);
    fixture.detectChanges();

    const statValores = fixture.debugElement.queryAll(
      By.css('.perfil-kiosquero-header__stat--link .perfil-kiosquero-header__stat-valor')
    );
    expect(statValores[0].nativeElement.textContent).toContain('7');
  });

  // ── @Input: productosSinStock ─────────────────────────────────────────────

  it('dado que productosSinStock es 0, NO debe aplicar la clase --alerta al stat de sin stock', () => {
    const stats = fixture.debugElement.queryAll(By.css('.perfil-kiosquero-header__stat'));
    // El último stat (sin link) corresponde a productosSinStock
    const statSinStock = stats[stats.length - 1];
    expect(statSinStock.nativeElement.classList).not.toContain(
      'perfil-kiosquero-header__stat--alerta'
    );
  });

  it('dado que productosSinStock es mayor a 0, debe aplicar la clase --alerta al stat de sin stock', () => {
    fixture.componentRef.setInput('productosSinStock', 3);
    fixture.detectChanges();

    const stats = fixture.debugElement.queryAll(By.css('.perfil-kiosquero-header__stat'));
    const statSinStock = stats[stats.length - 1];
    expect(statSinStock.nativeElement.classList).toContain(
      'perfil-kiosquero-header__stat--alerta'
    );
  });

  // ── RouterLink de pedidos pendientes ──────────────────────────────────────

  it('dado que se renderiza, el enlace de pedidos debe apuntar a /kiosquero/pedidos-tracking', () => {
    const enlace = fixture.debugElement.query(By.css('.perfil-kiosquero-header__stat--link'));
    expect(enlace.nativeElement.getAttribute('href')).toBe('/kiosquero/pedidos-tracking');
  });
});
