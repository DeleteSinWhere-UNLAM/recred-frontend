import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectivoDashboardComponent } from './directivo-dashboard.component';

describe('DirectivoDashboardComponent', () => {
  let component: DirectivoDashboardComponent;
  let fixture: ComponentFixture<DirectivoDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectivoDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DirectivoDashboardComponent);
    component = fixture.componentInstance;
  });

  it('dado el componente, cuando se monta, deberia crearse', () => {
    whenMonto();

    expect(component).toBeTruthy();
  });

  it('dado el componente, cuando se renderiza, deberia mostrar el titulo Panel Principal', () => {
    whenMonto();

    const h2Element = fixture.nativeElement.querySelector('h2');
    expect(h2Element.textContent.trim()).toBe('Panel Principal');
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
