import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CodigoRetiroCardComponent } from './codigo-retiro-card.component';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { Recreo } from '../../models/orden-compra.model';

// ─── Datos de prueba ────────────────────────────────────────────────────────

const alumnoConFoto: Alumno = {
  id: 'alumno-1',
  nombre: 'María',
  apellido: 'González',
  grado: '3ro A',
  colegioId: 'colegio-1',
  saldo: 1500,
  urlFotoPerfil: 'https://example.com/foto.jpg',
};

const alumnoSinFoto: Alumno = {
  id: 'alumno-2',
  nombre: 'Juan',
  apellido: 'Pérez',
  grado: '5to B',
  colegioId: 'colegio-1',
  saldo: 800,
  urlFotoPerfil: null,
};

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('CodigoRetiroCardComponent', () => {
  let componente: CodigoRetiroCardComponent;
  let fixture: ComponentFixture<CodigoRetiroCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodigoRetiroCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CodigoRetiroCardComponent);
    componente = fixture.componentInstance;

    // Inputs requeridos con valores iniciales
    fixture.componentRef.setInput('alumno', alumnoConFoto);
    fixture.componentRef.setInput('codigo', 'ABC-123');
    fixture.detectChanges();
  });

  // ── Creación ─────────────────────────────────────────────────────────────

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(componente).toBeTruthy();
  });

  // ── @Input() alumno ───────────────────────────────────────────────────────

  it('dado que recibe un alumno, debe reflejar el alumno en alumnoActual', () => {
    expect(componente.alumnoActual()).toEqual(alumnoConFoto);
  });

  it('dado que se actualiza el alumno, debe actualizar el signal', () => {
    fixture.componentRef.setInput('alumno', alumnoSinFoto);
    fixture.detectChanges();
    expect(componente.alumnoActual()?.id).toBe('alumno-2');
  });

  // ── Computed: urlFotoPerfil ───────────────────────────────────────────────

  it('dado que el alumno tiene urlFotoPerfil, debe retornarla', () => {
    expect(componente.urlFotoPerfil()).toBe('https://example.com/foto.jpg');
  });

  it('dado que el alumno NO tiene urlFotoPerfil, debe retornar null', () => {
    fixture.componentRef.setInput('alumno', alumnoSinFoto);
    fixture.detectChanges();
    expect(componente.urlFotoPerfil()).toBeNull();
  });

  // ── Computed: iniciales ───────────────────────────────────────────────────

  it('dado que el alumno tiene nombre y apellido, debe calcular las iniciales en mayúscula', () => {
    expect(componente.iniciales()).toBe('MG');
  });

  it('dado que el alumno es Juan Pérez, las iniciales deben ser JP', () => {
    fixture.componentRef.setInput('alumno', alumnoSinFoto);
    fixture.detectChanges();
    expect(componente.iniciales()).toBe('JP');
  });

  // ── Computed: nombreCompleto ──────────────────────────────────────────────

  it('dado que el alumno tiene nombre y apellido, debe construir el nombre completo', () => {
    expect(componente.nombreCompleto()).toBe('María González');
  });

  // ── Computed: recreoLabel ─────────────────────────────────────────────────

  it('dado recreo PRIMER_RECREO, debe retornar la etiqueta "1er Recreo"', () => {
    fixture.componentRef.setInput('recreo', 'PRIMER_RECREO');
    fixture.detectChanges();
    expect(componente.recreoLabel).toBe('1er Recreo');
  });

  it('dado recreo SEGUNDO_RECREO, debe retornar la etiqueta "2do Recreo"', () => {
    fixture.componentRef.setInput('recreo', 'SEGUNDO_RECREO');
    fixture.detectChanges();
    expect(componente.recreoLabel).toBe('2do Recreo');
  });

  it('dado recreo MEDIODIA, debe retornar la etiqueta "Mediodía"', () => {
    fixture.componentRef.setInput('recreo', 'MEDIODIA');
    fixture.detectChanges();
    expect(componente.recreoLabel).toBe('Mediodía');
  });

  it('dado recreo FUERA_HORA, debe retornar la etiqueta "Fuera de hora"', () => {
    fixture.componentRef.setInput('recreo', 'FUERA_HORA');
    fixture.detectChanges();
    expect(componente.recreoLabel).toBe('Fuera de hora');
  });

  // ── Template: @if(alumno) ─────────────────────────────────────────────────

  it('dado que el alumno está definido, debe renderizar el article', () => {
    const article = fixture.debugElement.query(By.css('.codigo-retiro'));
    expect(article).not.toBeNull();
  });

  it('dado que el alumno NO está definido, no debe renderizar el article', () => {
    const fixtureVacio = TestBed.createComponent(CodigoRetiroCardComponent);
    fixtureVacio.componentRef.setInput('codigo', 'XYZ');
    fixtureVacio.componentRef.setInput('alumno', undefined);
    fixtureVacio.detectChanges();
    const article = fixtureVacio.debugElement.query(By.css('.codigo-retiro'));
    expect(article).toBeNull();
  });

  // ── Template: @if(urlFotoPerfil) ─────────────────────────────────────────

  it('dado que el alumno tiene foto, debe mostrar el <img> de avatar', () => {
    const img = fixture.debugElement.query(By.css('.codigo-retiro__avatar-img'));
    expect(img).not.toBeNull();
  });

  it('dado que el alumno NO tiene foto, debe mostrar las iniciales en un <span>', () => {
    fixture.componentRef.setInput('alumno', alumnoSinFoto);
    fixture.detectChanges();

    const img = fixture.debugElement.query(By.css('.codigo-retiro__avatar-img'));
    const span = fixture.debugElement.query(By.css('.codigo-retiro__avatar span'));

    expect(img).toBeNull();
    expect(span).not.toBeNull();
    expect(span.nativeElement.textContent.trim()).toBe('JP');
  });

  // ── Template: nombre completo y código ────────────────────────────────────

  it('dado que el alumno tiene nombre, debe mostrarlo en el template', () => {
    const nombre = fixture.debugElement.query(By.css('.codigo-retiro__nombre'));
    expect(nombre.nativeElement.textContent).toContain('María González');
  });

  it('dado que el codigo es "ABC-123", debe mostrarlo en el template', () => {
    const codigoEl = fixture.debugElement.query(By.css('.codigo-retiro__codigo'));
    expect(codigoEl.nativeElement.textContent.trim()).toBe('ABC-123');
  });

  // ── @Input() fecha ────────────────────────────────────────────────────────

  it('dado que se provee una fecha, debe mostrarla junto al recreoLabel', () => {
    fixture.componentRef.setInput('fecha', '2025-08-10');
    fixture.detectChanges();
    const meta = fixture.debugElement.query(By.css('.codigo-retiro__meta'));
    expect(meta.nativeElement.textContent).toContain('2025-08-10');
  });

  // ── Todos los recreos cubren 100% de ramas ────────────────────────────────

  const recreosEsperados: Array<[Recreo, string]> = [
    ['PRIMER_RECREO', '1er Recreo'],
    ['SEGUNDO_RECREO', '2do Recreo'],
    ['MEDIODIA', 'Mediodía'],
    ['FUERA_HORA', 'Fuera de hora'],
  ];

  recreosEsperados.forEach(([recreo, etiqueta]) => {
    it(`dado recreo ${recreo}, el template debe mostrar "${etiqueta}"`, () => {
      fixture.componentRef.setInput('recreo', recreo);
      fixture.detectChanges();
      const meta = fixture.debugElement.query(By.css('.codigo-retiro__meta'));
      expect(meta.nativeElement.textContent).toContain(etiqueta);
    });
  });
});
