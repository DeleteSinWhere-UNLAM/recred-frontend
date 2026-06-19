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

  it('dado que hago clic en Carga Individual, deberia emitir el evento individualUpload', () => {
    spyOn(component.individualUpload, 'emit');
    component.onIndividualUpload();
    expect(component.individualUpload.emit).toHaveBeenCalled();
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
});
