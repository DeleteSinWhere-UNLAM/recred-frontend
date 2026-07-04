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
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería renderizar el panel principal', () => {
    const h2Element = fixture.nativeElement.querySelector('h2');
    expect(h2Element.textContent.trim()).toBe('Panel Principal');
  });
});
