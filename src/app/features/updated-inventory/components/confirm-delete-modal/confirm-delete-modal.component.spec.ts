import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDeleteModalComponent } from './confirm-delete-modal.component';

describe('ConfirmDeleteModalComponent', () => {
  let component: ConfirmDeleteModalComponent;
  let fixture: ComponentFixture<ConfirmDeleteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDeleteModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfirmDeleteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
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
