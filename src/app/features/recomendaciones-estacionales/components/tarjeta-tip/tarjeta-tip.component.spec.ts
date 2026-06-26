import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TarjetaTipComponent } from './tarjeta-tip.component';

describe('TarjetaTipComponent', () => {
  let component: TarjetaTipComponent;
  let fixture: ComponentFixture<TarjetaTipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaTipComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TarjetaTipComponent);
    component = fixture.componentInstance;
    component.tipPromocional = 'Prueba de tip promocional';
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar el texto del tip promocional', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.tip-card__texto')?.textContent).toContain('Prueba de tip promocional');
  });
});
