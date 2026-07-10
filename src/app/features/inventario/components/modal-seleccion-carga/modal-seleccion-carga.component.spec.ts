import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalSeleccionCargaComponent } from './modal-seleccion-carga.component';

describe('ModalSeleccionCargaComponent', () => {
  let component: ModalSeleccionCargaComponent;
  let fixture: ComponentFixture<ModalSeleccionCargaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalSeleccionCargaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalSeleccionCargaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado el modal, cuando hago click en Carga Asistida, deberia emitir el evento iaUpload', () => {
    const spyEmit = spyOn(component.iaUpload, 'emit');

    whenHagoClickEnCargaAsistida();

    thenSeEmitio(spyEmit);
  });

  it('dado el modal, cuando hago click en Carga Masiva, deberia emitir el evento bulkUpload', () => {
    const spyEmit = spyOn(component.bulkUpload, 'emit');

    whenHagoClickEnCargaMasiva();

    thenSeEmitio(spyEmit);
  });

  it('dado plan intermedio, cuando hago click en Carga Masiva, deberia emitir planBlocked y no bulkUpload', () => {
    component.planActual = 'INTERMEDIO';
    const spyBulk = spyOn(component.bulkUpload, 'emit');
    const spyBloqueo = spyOn(component.planBlocked, 'emit');

    whenHagoClickEnCargaMasiva();

    expect(spyBulk).not.toHaveBeenCalled();
    expect(spyBloqueo).toHaveBeenCalledWith('Avanzado');
  });

  it('dado plan intermedio, cuando hago click en Carga Asistida, deberia emitir iaUpload', () => {
    component.planActual = 'INTERMEDIO';
    const spyEmit = spyOn(component.iaUpload, 'emit');

    whenHagoClickEnCargaAsistida();

    thenSeEmitio(spyEmit);
  });

  it('dado plan gratuito, cuando hago click en Carga Asistida, deberia emitir planBlocked con "Intermedio"', () => {
    component.planActual = 'GRATUITO';
    const spyIa = spyOn(component.iaUpload, 'emit');
    const spyBloqueo = spyOn(component.planBlocked, 'emit');

    whenHagoClickEnCargaAsistida();

    expect(spyIa).not.toHaveBeenCalled();
    expect(spyBloqueo).toHaveBeenCalledWith('Intermedio');
  });

  it('dado el modal, cuando hago click en Cancelar o presiono esc/backdrop, deberia emitir closeModal', () => {
    const spyEmit = spyOn(component.closeModal, 'emit');

    whenHagoClickEnCancelar();

    thenSeEmitio(spyEmit);
  });

  it('dado el modal, cuando hago click en Carga Manual, deberia emitir manualUpload', () => {
    const spyEmit = spyOn(component.manualUpload, 'emit');

    whenHagoClickEnCargaManual();

    thenSeEmitio(spyEmit);
  });

  function whenHagoClickEnCargaAsistida(): void {
    component.onIaUpload();
  }

  function whenHagoClickEnCargaMasiva(): void {
    component.onBulkUpload();
  }

  function whenHagoClickEnCargaManual(): void {
    component.onManualUpload();
  }

  function whenHagoClickEnCancelar(): void {
    component.onCancel();
  }

  function thenSeEmitio(spyEmit: jasmine.Spy): void {
    expect(spyEmit).toHaveBeenCalled();
  }
});
