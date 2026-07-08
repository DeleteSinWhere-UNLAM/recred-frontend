import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CapturaCamara } from './captura-camara';

describe('CapturaCamara', () => {
  let component: CapturaCamara;
  let fixture: ComponentFixture<CapturaCamara>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CapturaCamara],
    }).compileComponents();

    fixture = TestBed.createComponent(CapturaCamara);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Estado inicial', () => {
    it('dado el componente recien creado, no deberia tener errorMessage ni estar escaneando', () => {
      expect(component.errorMessage).toBeNull();
      expect(component.isScanning).toBeFalse();
    });
  });

  describe('onFileSelected', () => {
    it('dado una imagen valida, cuando el input cambia, deberia emitir photoTaken', () => {
      const imagen = crearArchivo('foto.jpg', 'image/jpeg', 1024);
      spyOn(component.photoTaken, 'emit');

      whenSeleccionoArchivo(imagen);

      expect(component.photoTaken.emit).toHaveBeenCalledWith(imagen);
      expect(component.errorMessage).toBeNull();
    });

    it('dado un archivo de tipo no permitido, cuando el input cambia, deberia setear errorMessage y no emitir', () => {
      const pdf = crearArchivo('doc.pdf', 'application/pdf', 1024);
      spyOn(component.photoTaken, 'emit');

      whenSeleccionoArchivo(pdf);

      expect(component.errorMessage).toContain('Solo se permiten archivos de imagen');
      expect(component.photoTaken.emit).not.toHaveBeenCalled();
    });

    it('dado una imagen mayor a 10MB, cuando el input cambia, deberia setear errorMessage y no emitir', () => {
      const imagenPesada = crearArchivo('grande.jpg', 'image/jpeg', 11 * 1024 * 1024);
      spyOn(component.photoTaken, 'emit');

      whenSeleccionoArchivo(imagenPesada);

      expect(component.errorMessage).toContain('10MB');
      expect(component.photoTaken.emit).not.toHaveBeenCalled();
    });

    it('dado que no hay archivo seleccionado, cuando el input cambia, no deberia emitir', () => {
      spyOn(component.photoTaken, 'emit');
      const evento = { target: { files: null } } as unknown as Event;

      component.onFileSelected(evento);

      expect(component.photoTaken.emit).not.toHaveBeenCalled();
    });
  });

  function crearArchivo(nombre: string, tipo: string, size: number): File {
    const contenido = new Uint8Array(size);
    return new File([contenido], nombre, { type: tipo });
  }

  function whenSeleccionoArchivo(archivo: File): void {
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      value: [archivo],
      writable: false,
    });
    const evento = { target: input } as unknown as Event;
    component.onFileSelected(evento);
  }
});
