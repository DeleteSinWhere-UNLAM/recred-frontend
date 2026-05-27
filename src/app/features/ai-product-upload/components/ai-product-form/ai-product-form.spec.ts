import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiProductForm } from './ai-product-form';

describe('AiProductForm', () => {
  let component: AiProductForm;
  let fixture: ComponentFixture<AiProductForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiProductForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiProductForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
