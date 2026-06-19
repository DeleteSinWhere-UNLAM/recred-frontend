import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsejoCardComponent } from './consejo-card.component';

describe('ConsejoCardComponent', () => {
  let component: ConsejoCardComponent;
  let fixture: ComponentFixture<ConsejoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsejoCardComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ConsejoCardComponent);
    component = fixture.componentInstance;
  });

  it('dado que recibe tipPromocional, deberia setearlo correctamente', () => {
    component.tipPromocional = 'Test Tip';
    fixture.detectChanges();
    expect(component.tipPromocional).toBe('Test Tip');
  });
});
