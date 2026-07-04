import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { SeleccionarAlumnoModalComponent } from './seleccionar-alumno-modal.component';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { Colegio } from '../../../../data-access/models/colegio.model';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { AlumnoMother } from '../../../../data-access/services/alumno.mother';

describe('SeleccionarAlumnoModalComponent', () => {
  let componente: SeleccionarAlumnoModalComponent;
  let fixture: ComponentFixture<SeleccionarAlumnoModalComponent>;

  const colegios: Colegio[] = [
    { id: 'col-1', nombre: 'Colegio A' },
    { id: 'col-2', nombre: 'Colegio B' },
  ];

  const alumnoJuan = AlumnoMother.crear({
    id: 'alum-1',
    nombre: 'Juan',
    apellido: 'Perez',
    colegioId: 'col-1',
    urlFotoPerfil: 'url-foto',
  });

  const alumnoMaria = AlumnoMother.crear({
    id: 'alum-2',
    nombre: 'Maria',
    apellido: 'Gomez',
    colegioId: 'col-3',
    urlFotoPerfil: '',
  });

  beforeEach(async () => {
    const usuarioServiceMock = { esVistaAlumno: signal(true) } as Partial<UsuarioService>;

    await TestBed.configureTestingModule({
      imports: [SeleccionarAlumnoModalComponent],
      providers: [{ provide: UsuarioService, useValue: usuarioServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(SeleccionarAlumnoModalComponent);
    componente = fixture.componentInstance;
  });

  it('dado que se inicializa sin datos, deberia crearse correctamente', () => {
    givenInputs([], []);

    whenRenderizo();

    expect(componente).toBeTruthy();
  });

  describe('comportamiento de renderizado con datos', () => {
    beforeEach(() => {
      givenInputs([alumnoJuan, alumnoMaria], colegios, 'alum-1');
      whenRenderizo();
    });

    it('dado dos alumnos, cuando renderizo, deberia mostrar dos items en la lista', () => {
      const items = fixture.debugElement.queryAll(By.css('.modal-alumno__item'));
      expect(items.length).toBe(2);
    });

    it('dado un alumno actual, cuando renderizo, deberia marcarlo con la clase y mostrar el check', () => {
      const opciones = fixture.debugElement.queryAll(By.css('.modal-alumno__opcion'));

      expect(opciones[0].nativeElement.classList.contains('modal-alumno__opcion--actual')).toBeTrue();
      expect(opciones[0].query(By.css('.fa-circle-check'))).not.toBeNull();

      expect(opciones[1].nativeElement.classList.contains('modal-alumno__opcion--actual')).toBeFalse();
      expect(opciones[1].query(By.css('.fa-chevron-right'))).not.toBeNull();
    });

    it('dado un alumno con foto, cuando renderizo, deberia mostrar la imagen', () => {
      const img = fixture.debugElement.queryAll(By.css('.modal-alumno__avatar-img'));
      expect(img.length).toBe(1);
      expect(img[0].nativeElement.src).toContain('url-foto');
    });

    it('dado un alumno sin foto, cuando renderizo, deberia mostrar las iniciales', () => {
      const opciones = fixture.debugElement.queryAll(By.css('.modal-alumno__opcion'));
      expect(opciones[1].nativeElement.textContent).toContain('MG');
    });

    it('dado un alumno con colegio valido, cuando renderizo, deberia mostrar el nombre del colegio', () => {
      const datos = fixture.debugElement.queryAll(By.css('.modal-alumno__colegio'));
      expect(datos[0].nativeElement.textContent).toContain('Colegio A');
    });
  });

  describe('comportamiento de metodos internos protegidos', () => {
    it('dado distintos alumnos, cuando consulto sus iniciales, deberia devolver las primeras letras en mayusculas', () => {
      expect((componente as unknown as { iniciales: (a: Alumno) => string }).iniciales(alumnoJuan)).toBe('JP');
      expect((componente as unknown as { iniciales: (a: Alumno) => string }).iniciales(alumnoMaria)).toBe('MG');

      const vacio = AlumnoMother.crear({ nombre: '', apellido: '' });
      expect((componente as unknown as { iniciales: (a: Alumno) => string }).iniciales(vacio)).toBe('');
    });

    it('dado vista tutor, cuando consulto las iniciales, deberia devolver solo la primera del nombre', () => {
      const usuarioService = TestBed.inject(UsuarioService);
      (usuarioService.esVistaAlumno as unknown as { set(v: boolean): void }).set(false);

      expect((componente as unknown as { iniciales: (a: Alumno) => string }).iniciales(alumnoJuan)).toBe('J');
    });

    it('dado vista tutor con alumno sin nombre, cuando consulto las iniciales, deberia devolver ""', () => {
      const usuarioService = TestBed.inject(UsuarioService);
      (usuarioService.esVistaAlumno as unknown as { set(v: boolean): void }).set(false);
      const vacio = AlumnoMother.crear({ nombre: '', apellido: 'X' });

      expect((componente as unknown as { iniciales: (a: Alumno) => string }).iniciales(vacio)).toBe('');
    });

    it('dado un colegioId existente, cuando consulto su nombre, deberia devolverlo', () => {
      componente.colegios = colegios;

      expect((componente as unknown as { nombreColegio: (id: string) => string }).nombreColegio('col-1')).toBe('Colegio A');
    });

    it('dado un colegioId inexistente, cuando consulto su nombre, deberia devolver string vacio', () => {
      componente.colegios = colegios;

      expect((componente as unknown as { nombreColegio: (id: string) => string }).nombreColegio('col-X')).toBe('');
    });
  });

  describe('emision de eventos (@Output)', () => {
    beforeEach(() => {
      givenInputs([alumnoJuan, alumnoMaria], colegios);
      whenRenderizo();
    });

    it('dado un alumno renderizado, cuando hago click sobre el, deberia emitir seleccionar con su id', () => {
      const emitSpy = spyOn(componente.seleccionar, 'emit');

      whenHagoClickEnAlumno(1);

      expect(emitSpy).toHaveBeenCalledWith('alum-2');
    });

    it('dado el modal abierto, cuando hago click en el boton cerrar, deberia emitir cerrar', () => {
      const emitSpy = spyOn(componente.cerrar, 'emit');

      whenHagoClickEn('.modal-alumno__cerrar');

      expect(emitSpy).toHaveBeenCalled();
    });

    it('dado el modal abierto, cuando presiono Escape, deberia emitir cerrar', () => {
      const emitSpy = spyOn(componente.cerrar, 'emit');

      (componente as unknown as { onEscape: () => void }).onEscape();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('dado un click en el backdrop, cuando target y currentTarget son el mismo, deberia emitir cerrar', () => {
      const emitSpy = spyOn(componente.cerrar, 'emit');
      const backdrop = fixture.debugElement.query(By.css('.modal-alumno__backdrop')).nativeElement;

      whenHagoClickEnBackdrop(backdrop, backdrop);

      expect(emitSpy).toHaveBeenCalled();
    });

    it('dado un click dentro del modal, cuando target y currentTarget difieren, no deberia emitir cerrar', () => {
      const emitSpy = spyOn(componente.cerrar, 'emit');
      const backdrop = fixture.debugElement.query(By.css('.modal-alumno__backdrop')).nativeElement;
      const modal = fixture.debugElement.query(By.css('.modal-alumno')).nativeElement;

      whenHagoClickEnBackdrop(modal, backdrop);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  function givenInputs(alumnos: Alumno[], colegiosInput: Colegio[], alumnoActualId?: string): void {
    componente.alumnos = alumnos;
    componente.colegios = colegiosInput;
    if (alumnoActualId) componente.alumnoActualId = alumnoActualId;
  }

  function whenRenderizo(): void {
    fixture.detectChanges();
  }

  function whenHagoClickEnAlumno(indice: number): void {
    const opciones = fixture.debugElement.queryAll(By.css('.modal-alumno__opcion'));
    opciones[indice].nativeElement.click();
  }

  function whenHagoClickEn(selector: string): void {
    const elemento = fixture.debugElement.query(By.css(selector)).nativeElement as HTMLElement;
    elemento.click();
  }

  function whenHagoClickEnBackdrop(target: HTMLElement, currentTarget: HTMLElement): void {
    const evento = { target, currentTarget } as unknown as MouseEvent;
    (componente as unknown as { onBackdropClick: (e: MouseEvent) => void }).onBackdropClick(evento);
  }
});
