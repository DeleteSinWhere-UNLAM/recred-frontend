import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component';
import { CropModalComponent } from './crop-modal.component';

// eslint-disable-next-line @angular-eslint/component-selector
@Component({ selector: 'image-cropper', template: '', standalone: true })
class ImageCropperStub {
  @Input() imageChangedEvent: Event | null = null;
  @Input() maintainAspectRatio = false;
  @Input() aspectRatio = 1;
  @Input() roundCropper = false;
  @Input() format = 'png';
  @Output() imageCropped = new EventEmitter<ImageCroppedEvent>();
}

@Component({
  selector: 'app-button-component',
  template: '<button (click)="Click.emit()"><ng-content></ng-content></button>',
  standalone: true,
})
class ButtonStub {
  @Input() variant = 'primary';
  @Output() Click = new EventEmitter<void>();
}

describe('CropModalComponent', () => {
  let component: CropModalComponent;
  let fixture: ComponentFixture<CropModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropModalComponent],
    })
      .overrideComponent(CropModalComponent, {
        remove: { imports: [ImageCropperComponent, ButtonComponent] },
        add: { imports: [ImageCropperStub, ButtonStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CropModalComponent);
    component = fixture.componentInstance;
    component.imageEvent = givenUnImageEvent();
    fixture.detectChanges();
  });

  describe('inicializacion', () => {
    it('deberia crear el componente', () => {
      expect(component).toBeTruthy();
    });

    it('dado el modal abierto, cuando se monta, deberia mostrar el titulo Ajustar foto de perfil', () => {
      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('Ajustar foto de perfil');
    });
  });

  describe('confirmar recorte', () => {
    it('dado que el usuario ya recorto la imagen, cuando hago click en Guardar, deberia emitir el blob por (cropped)', () => {
      const blob = new Blob(['contenido'], { type: 'image/webp' });
      const spyCropped = jasmine.createSpy('cropped');
      component.cropped.subscribe(spyCropped);

      whenSeRecorto(blob);
      whenHagoClickEnGuardar();

      expect(spyCropped).toHaveBeenCalledWith(blob);
    });

    it('dado que todavia no hubo recorte, cuando hago click en Guardar, no deberia emitir (cropped)', () => {
      const spyCropped = jasmine.createSpy('cropped');
      component.cropped.subscribe(spyCropped);

      whenHagoClickEnGuardar();

      expect(spyCropped).not.toHaveBeenCalled();
    });

    it('dado un recorte sin blob (undefined), cuando hago click en Guardar, no deberia emitir (cropped)', () => {
      const spyCropped = jasmine.createSpy('cropped');
      component.cropped.subscribe(spyCropped);

      whenSeRecortoSinBlob();
      whenHagoClickEnGuardar();

      expect(spyCropped).not.toHaveBeenCalled();
    });
  });

  describe('cancelar', () => {
    it('dado el modal abierto, cuando hago click en Cancelar, deberia emitir (canceled)', () => {
      const spyCanceled = jasmine.createSpy('canceled');
      component.canceled.subscribe(spyCanceled);

      whenHagoClickEnCancelar();

      expect(spyCanceled).toHaveBeenCalled();
    });
  });

  function givenUnImageEvent(): Event {
    return new Event('change');
  }

  function whenSeRecorto(blob: Blob): void {
    const stub = fixture.debugElement.query(By.directive(ImageCropperStub)).componentInstance as ImageCropperStub;
    stub.imageCropped.emit({ blob } as ImageCroppedEvent);
  }

  function whenSeRecortoSinBlob(): void {
    const stub = fixture.debugElement.query(By.directive(ImageCropperStub)).componentInstance as ImageCropperStub;
    stub.imageCropped.emit({} as ImageCroppedEvent);
  }

  function whenHagoClickEnGuardar(): void {
    const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('app-button-component button');
    (botones[1] as HTMLButtonElement).click();
  }

  function whenHagoClickEnCancelar(): void {
    const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('app-button-component button');
    (botones[0] as HTMLButtonElement).click();
  }
});
