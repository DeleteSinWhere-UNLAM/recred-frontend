import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SeleccionarAlumnoModalComponent } from './seleccionar-alumno-modal.component';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { Colegio } from '../../../../data-access/models/colegio.model';

describe('SeleccionarAlumnoModalComponent', () => {
  let componente: SeleccionarAlumnoModalComponent;
  let fixture: ComponentFixture<SeleccionarAlumnoModalComponent>;

  const mockColegios = [
    { id: 'col-1', nombre: 'Colegio A' } as Colegio,
    { id: 'col-2', nombre: 'Colegio B' } as Colegio,
  ];

  const mockAlumnos = [
    {
      id: 'alum-1',
      nombre: 'Juan',
      apellido: 'Perez',
      colegioId: 'col-1',
      urlFotoPerfil: 'url-foto'
    } as Alumno,
    {
      id: 'alum-2',
      nombre: 'Maria',
      apellido: 'Gomez',
      colegioId: 'col-3', // Colegio no existente
      urlFotoPerfil: ''
    } as Alumno,
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionarAlumnoModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SeleccionarAlumnoModalComponent);
    componente = fixture.componentInstance;
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    componente.alumnos = [];
    componente.colegios = [];
    fixture.detectChanges();
    expect(componente).toBeTruthy();
  });

  describe('comportamiento de renderizado con datos', () => {
    beforeEach(() => {
      componente.alumnos = mockAlumnos;
      componente.colegios = mockColegios;
      componente.alumnoActualId = 'alum-1';
      fixture.detectChanges();
    });

    it('dado que recibe alumnos, debe renderizarlos en la lista', () => {
      const items = fixture.debugElement.queryAll(By.css('.modal-alumno__item'));
      expect(items.length).toBe(2);
    });

    it('dado que un alumno es el actual, debe marcarse con la clase y el icono de check', () => {
      const opciones = fixture.debugElement.queryAll(By.css('.modal-alumno__opcion'));
      
      // El primero es alum-1 (actual)
      expect(opciones[0].nativeElement.classList.contains('modal-alumno__opcion--actual')).toBeTrue();
      const checkIcon = opciones[0].query(By.css('.fa-circle-check'));
      expect(checkIcon).not.toBeNull();

      // El segundo no es actual
      expect(opciones[1].nativeElement.classList.contains('modal-alumno__opcion--actual')).toBeFalse();
      const chevronIcon = opciones[1].query(By.css('.fa-chevron-right'));
      expect(chevronIcon).not.toBeNull();
    });

    it('dado que un alumno tiene foto, debe renderizar la imagen', () => {
      const img = fixture.debugElement.queryAll(By.css('.modal-alumno__avatar-img'));
      expect(img.length).toBe(1); // Solo Juan tiene foto
      expect(img[0].nativeElement.src).toContain('url-foto');
    });

    it('dado que un alumno no tiene foto, debe mostrar las iniciales', () => {
      const opciones = fixture.debugElement.queryAll(By.css('.modal-alumno__opcion'));
      // Maria no tiene foto
      expect(opciones[1].nativeElement.textContent).toContain('MG');
    });

    it('dado que un alumno tiene un colegio válido, debe mostrar el nombre del colegio', () => {
      const datos = fixture.debugElement.queryAll(By.css('.modal-alumno__colegio'));
      expect(datos[0].nativeElement.textContent).toContain('Colegio A');
    });
  });

  describe('comportamiento de métodos internos protegidos', () => {
    it('dado que se buscan las iniciales, debe devolver la primera letra de nombre y apellido en mayuscula', () => {
      expect((componente as any).iniciales(mockAlumnos[0])).toBe('JP');
      expect((componente as any).iniciales(mockAlumnos[1])).toBe('MG');
      
      // Edge case: strings vacíos
      const mockVacio = { nombre: '', apellido: '' } as Alumno;
      expect((componente as any).iniciales(mockVacio)).toBe('');
    });

    it('dado que se busca el nombre de un colegio existente, debe devolverlo', () => {
      componente.colegios = mockColegios;
      expect((componente as any).nombreColegio('col-1')).toBe('Colegio A');
    });

    it('dado que se busca el nombre de un colegio inexistente, debe devolver string vacío', () => {
      componente.colegios = mockColegios;
      expect((componente as any).nombreColegio('col-X')).toBe('');
    });
  });

  describe('emisión de eventos (@Output)', () => {
    beforeEach(() => {
      componente.alumnos = mockAlumnos;
      componente.colegios = mockColegios;
      fixture.detectChanges();
    });

    it('dado que se hace clic en un alumno, debe emitir seleccionar con el ID', () => {
      spyOn(componente.seleccionar, 'emit');
      const opciones = fixture.debugElement.queryAll(By.css('.modal-alumno__opcion'));
      
      opciones[1].nativeElement.click(); // clic en alum-2
      expect(componente.seleccionar.emit).toHaveBeenCalledWith('alum-2');
    });

    it('dado que se hace clic en el botón de cerrar, debe emitir cerrar', () => {
      spyOn(componente.cerrar, 'emit');
      const btnCerrar = fixture.debugElement.query(By.css('.modal-alumno__cerrar')).nativeElement;
      
      btnCerrar.click();
      expect(componente.cerrar.emit).toHaveBeenCalled();
    });

    it('dado que se presiona la tecla Escape, debe emitir cerrar', () => {
      spyOn(componente.cerrar, 'emit');
      
      // Simular HostListener document:keydown.escape
      (componente as any).onEscape();
      expect(componente.cerrar.emit).toHaveBeenCalled();
    });

    it('dado que se hace clic en el backdrop, debe emitir cerrar', () => {
      spyOn(componente.cerrar, 'emit');
      
      const backdrop = fixture.debugElement.query(By.css('.modal-alumno__backdrop')).nativeElement;
      
      // Simulamos el evento donde target y currentTarget son el mismo
      const mockEvent = { target: backdrop, currentTarget: backdrop } as unknown as MouseEvent;
      (componente as any).onBackdropClick(mockEvent);
      
      expect(componente.cerrar.emit).toHaveBeenCalled();
    });

    it('dado que se hace clic dentro del modal (no en el backdrop), no debe emitir cerrar', () => {
      spyOn(componente.cerrar, 'emit');
      
      const backdrop = fixture.debugElement.query(By.css('.modal-alumno__backdrop')).nativeElement;
      const modal = fixture.debugElement.query(By.css('.modal-alumno')).nativeElement;
      
      // Simulamos el evento donde target es el modal interno pero currentTarget es el backdrop
      const mockEvent = { target: modal, currentTarget: backdrop } as unknown as MouseEvent;
      (componente as any).onBackdropClick(mockEvent);
      
      expect(componente.cerrar.emit).not.toHaveBeenCalled();
    });
  });
});
