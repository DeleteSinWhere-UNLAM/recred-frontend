import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CropModalComponent } from './crop-modal.component';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';

describe('CropModalComponent', () => {
  let componente: CropModalComponent;
  let fixture: ComponentFixture<CropModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropModalComponent] // importa ImageCropperComponent y ButtonComponent
    }).compileComponents();

    fixture = TestBed.createComponent(CropModalComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que imageCropped recibe un evento, debe guardar el blob', () => {
    const mockBlob = new Blob(['mock-image-data'], { type: 'image/webp' });
    const mockEvent: ImageCroppedEvent = {
      blob: mockBlob,
      base64: 'data:image/webp;base64,...',
      width: 100,
      height: 100,
      cropperPosition: { x1: 0, y1: 0, x2: 100, y2: 100 },
      imagePosition: { x1: 0, y1: 0, x2: 100, y2: 100 }
    };

    (componente as any).imageCropped(mockEvent);

    expect((componente as any).croppedBlob).toBe(mockBlob);
  });

  it('dado que imageCropped recibe evento sin blob, debe guardar null', () => {
    const mockEvent = { blob: undefined } as unknown as ImageCroppedEvent;

    (componente as any).imageCropped(mockEvent);

    expect((componente as any).croppedBlob).toBeNull();
  });

  it('dado que se confirma con un blob guardado, debe emitir el evento cropped', () => {
    spyOn(componente.cropped, 'emit');
    const mockBlob = new Blob(['mock'], { type: 'image/webp' });
    (componente as any).croppedBlob = mockBlob;

    (componente as any).confirm();

    expect(componente.cropped.emit).toHaveBeenCalledWith(mockBlob);
  });

  it('dado que se confirma sin blob, no debe emitir el evento', () => {
    spyOn(componente.cropped, 'emit');
    (componente as any).croppedBlob = null;

    (componente as any).confirm();

    expect(componente.cropped.emit).not.toHaveBeenCalled();
  });

  it('dado que se cancela, debe emitir el evento canceled', () => {
    spyOn(componente.canceled, 'emit');

    (componente as any).cancel();

    expect(componente.canceled.emit).toHaveBeenCalled();
  });
});
