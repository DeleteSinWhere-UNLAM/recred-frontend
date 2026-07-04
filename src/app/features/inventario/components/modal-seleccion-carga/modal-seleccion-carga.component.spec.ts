import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalSeleccionCargaComponent } from './modal-seleccion-carga.component';

describe('ModalSeleccionCargaComponent', () => {
  let component: ModalSeleccionCargaComponent;
  let fixture: ComponentFixture<ModalSeleccionCargaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalSeleccionCargaComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalSeleccionCargaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que hago clic en Carga Asistida, deberia emitir el evento iaUpload', () => {
    spyOn(component.iaUpload, 'emit');
    component.onIaUpload();
    expect(component.iaUpload.emit).toHaveBeenCalled();
  });

  it('dado que hago clic en Carga Masiva, deberia emitir el evento bulkUpload', () => {
    spyOn(component.bulkUpload, 'emit');
    component.onBulkUpload();
    expect(component.bulkUpload.emit).toHaveBeenCalled();
  });

  it('dado que hago clic en Cancelar o presiono esc/backdrop, deberia emitir el evento cancel', () => {
    spyOn(component.closeModal, 'emit');
    component.onCancel();
    expect(component.closeModal.emit).toHaveBeenCalled();
  });

  it('dado que hago clic en Carga Manual, deberia emitir manualUpload', () => {
    spyOn(component.manualUpload, 'emit');

    component.onManualUpload();

    expect(component.manualUpload.emit).toHaveBeenCalled();
  });
});
