import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalConfirmarEliminarComponent } from './modal-confirmar-eliminar.component';

describe('ModalConfirmarEliminarComponent', () => {
  let component: ModalConfirmarEliminarComponent;
  let fixture: ComponentFixture<ModalConfirmarEliminarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalConfirmarEliminarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalConfirmarEliminarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería emitir el evento confirmed al disparar la acción de confirmación', () => {
    spyOn(component.confirmed, 'emit');
    
    component.confirmed.emit();
    
    expect(component.confirmed.emit).toHaveBeenCalled();
  });

  it('debería emitir el evento cancelled al disparar la acción de cancelación', () => {
    spyOn(component.cancelled, 'emit');
    
    component.cancelled.emit();
    
    expect(component.cancelled.emit).toHaveBeenCalled();
  });
});
