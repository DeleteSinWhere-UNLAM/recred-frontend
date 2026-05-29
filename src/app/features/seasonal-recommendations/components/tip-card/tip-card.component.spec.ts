import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TipCardComponent } from './tip-card.component';

describe('TipCardComponent', () => {
  let component: TipCardComponent;
  let fixture: ComponentFixture<TipCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TipCardComponent);
    component = fixture.componentInstance;
    component.tipPromocional = 'Prueba de tip promocional';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the promotional tip text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.tip-content p')?.textContent).toContain('Prueba de tip promocional');
  });
});
