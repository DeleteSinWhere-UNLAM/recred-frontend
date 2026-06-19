import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CameraCapture } from './camera-capture';

describe('CameraCapture', () => {
  let component: CameraCapture;
  let fixture: ComponentFixture<CameraCapture>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CameraCapture]
    }).compileComponents();

    fixture = TestBed.createComponent(CameraCapture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('onFileSelected', () => {
    it('dado que no se selecciona ningun archivo, deberia retornar temprano y no emitir', () => {
      spyOn(component.photoTaken, 'emit');
      const mockEvent = { target: { files: [] } } as unknown as Event;

      component.onFileSelected(mockEvent);

      expect(component.photoTaken.emit).not.toHaveBeenCalled();
      expect(component.errorMessage).toBeNull();
    });

    it('dado que el archivo tiene un tipo no permitido, deberia mostrar error', () => {
      spyOn(component.photoTaken, 'emit');
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      const inputElement = document.createElement('input');
      spyOnProperty(inputElement, 'files').and.returnValue([file] as any);
      const mockEvent = { target: inputElement } as unknown as Event;

      component.onFileSelected(mockEvent);

      expect(component.errorMessage).toBe('Solo se permiten archivos de imagen (JPEG, PNG, WebP, GIF, BMP).');
      expect(component.photoTaken.emit).not.toHaveBeenCalled();
      expect(inputElement.value).toBe('');
    });

    it('dado que el archivo excede el tamaño maximo, deberia mostrar error', () => {
      spyOn(component.photoTaken, 'emit');
      const arrayBuffer = new ArrayBuffer(11 * 1024 * 1024);
      const file = new File([arrayBuffer], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });

      const inputElement = document.createElement('input');
      spyOnProperty(inputElement, 'files').and.returnValue([file] as any);
      const mockEvent = { target: inputElement } as unknown as Event;

      component.onFileSelected(mockEvent);

      expect(component.errorMessage).toBe('La imagen no debe superar los 10MB.');
      expect(component.photoTaken.emit).not.toHaveBeenCalled();
      expect(inputElement.value).toBe('');
    });

    it('dado que el archivo es valido, deberia limpiar el error y emitir el archivo', () => {
      spyOn(component.photoTaken, 'emit');
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const inputElement = document.createElement('input');
      spyOnProperty(inputElement, 'files').and.returnValue([file] as any);
      const mockEvent = { target: inputElement } as unknown as Event;

      component.onFileSelected(mockEvent);

      expect(component.errorMessage).toBeNull();
      expect(component.photoTaken.emit).toHaveBeenCalledWith(file);
    });
  });
});
