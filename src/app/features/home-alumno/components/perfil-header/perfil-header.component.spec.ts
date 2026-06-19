import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PerfilHeaderComponent } from './perfil-header.component';

// ─── Suite de pruebas ─────────────────────────────────────────────────────────

describe('PerfilHeaderComponent', () => {
  let componente: PerfilHeaderComponent;
  let fixture: ComponentFixture<PerfilHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilHeaderComponent);
    componente = fixture.componentInstance;

    // Valores por defecto para los @Input requeridos
    fixture.componentRef.setInput('iniciales', 'JP');
    fixture.componentRef.setInput('nombreCompleto', 'Juan Pérez');
    fixture.componentRef.setInput('grado', '5to B');
    fixture.componentRef.setInput('colegio', 'Colegio Nacional');
    fixture.componentRef.setInput('saldoFormateado', '$2.500');
    fixture.detectChanges();
  });

  // ── Creación ──────────────────────────────────────────────────────────────

  it('dado que se inicializa con todos los inputs requeridos, debe crearse correctamente', () => {
    expect(componente).toBeTruthy();
  });

  // ── @Input: nombreCompleto ────────────────────────────────────────────────

  it('dado que recibe nombreCompleto, debe mostrarlo en el h1', () => {
    const nombre = fixture.debugElement.query(By.css('.perfil-header__nombre'));
    expect(nombre.nativeElement.textContent).toContain('Juan Pérez');
  });

  it('dado que recibe nombreCompleto, debe incluirlo en el aria-label de la sección', () => {
    const seccion = fixture.debugElement.query(By.css('.perfil-header'));
    expect(seccion.nativeElement.getAttribute('aria-label')).toBe('Perfil de Juan Pérez');
  });

  // ── @Input: grado y colegio ────────────────────────────────────────────────

  it('dado que recibe grado y colegio, debe mostrarlos en el subtítulo separados por "·"', () => {
    const subtitulo = fixture.debugElement.query(By.css('.perfil-header__subtitulo span'));
    expect(subtitulo.nativeElement.textContent).toContain('5to B · Colegio Nacional');
  });

  // ── @Input: saldoFormateado ────────────────────────────────────────────────

  it('dado que recibe saldoFormateado, debe mostrarlo en el elemento de saldo', () => {
    const saldoValor = fixture.debugElement.query(By.css('.perfil-header__saldo-valor'));
    expect(saldoValor.nativeElement.textContent).toContain('$2.500');
  });

  // ── @Input: saldoNegativo ─────────────────────────────────────────────────

  it('dado que saldoNegativo es false (por defecto), NO debe aplicar la clase --negativo al saldo', () => {
    const saldo = fixture.debugElement.query(By.css('.perfil-header__saldo'));
    expect(saldo.nativeElement.classList).not.toContain('perfil-header__saldo--negativo');
  });

  it('dado que saldoNegativo es true, debe aplicar la clase --negativo al elemento de saldo', () => {
    fixture.componentRef.setInput('saldoNegativo', true);
    fixture.detectChanges();

    const saldo = fixture.debugElement.query(By.css('.perfil-header__saldo'));
    expect(saldo.nativeElement.classList).toContain('perfil-header__saldo--negativo');
  });

  // ── @if (urlFotoPerfil) → rama SIN foto ───────────────────────────────────

  it('dado que urlFotoPerfil es null, debe mostrar las iniciales en el avatar', () => {
    fixture.componentRef.setInput('urlFotoPerfil', null);
    fixture.detectChanges();

    const iniciales = fixture.debugElement.query(By.css('.perfil-header__avatar span'));
    expect(iniciales.nativeElement.textContent).toContain('JP');
  });

  it('dado que urlFotoPerfil es null, NO debe renderizar una etiqueta img de avatar', () => {
    fixture.componentRef.setInput('urlFotoPerfil', null);
    fixture.detectChanges();

    const foto = fixture.debugElement.query(By.css('.perfil-header__avatar-img'));
    expect(foto).toBeNull();
  });

  // ── @if (urlFotoPerfil) → rama CON foto ───────────────────────────────────

  it('dado que urlFotoPerfil tiene valor, debe renderizar la imagen de avatar con el src correcto', () => {
    fixture.componentRef.setInput('urlFotoPerfil', 'https://ejemplo.com/foto.jpg');
    fixture.detectChanges();

    const foto = fixture.debugElement.query(By.css('.perfil-header__avatar-img'));
    expect(foto).not.toBeNull();
    expect(foto.nativeElement.getAttribute('src')).toBe('https://ejemplo.com/foto.jpg');
  });

  it('dado que urlFotoPerfil tiene valor, la imagen debe tener el alt con el nombre del usuario', () => {
    fixture.componentRef.setInput('urlFotoPerfil', 'https://ejemplo.com/foto.jpg');
    fixture.detectChanges();

    const foto = fixture.debugElement.query(By.css('.perfil-header__avatar-img'));
    expect(foto.nativeElement.getAttribute('alt')).toBe('Foto de Juan Pérez');
  });
});
