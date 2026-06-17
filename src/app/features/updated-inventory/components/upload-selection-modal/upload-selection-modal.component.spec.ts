import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadSelectionModalComponent } from './upload-selection-modal.component';

describe('UploadSelectionModalComponent', () => {
  let component: UploadSelectionModalComponent;
  let fixture: ComponentFixture<UploadSelectionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadSelectionModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadSelectionModalComponent);
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
