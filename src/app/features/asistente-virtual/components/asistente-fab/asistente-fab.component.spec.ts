import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsistenteFabComponent } from './asistente-fab.component';

describe('AsistenteFabComponent', () => {
  let component: AsistenteFabComponent;
  let fixture: ComponentFixture<AsistenteFabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsistenteFabComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AsistenteFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, deberia tener valores por defecto', () => {
    expect(component.oculto).toBeFalse();
    expect(component.mostrarBadge).toBeTrue();
  });

  it('dado que se hace click, deberia emitir el evento togglePanel', () => {
    spyOn(component.togglePanel, 'emit');
    component['onClick']();
    expect(component.togglePanel.emit).toHaveBeenCalled();
  });
});
