import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CapturaCamara } from './captura-camara';

describe('CapturaCamara', () => {
  let component: CapturaCamara;
  let fixture: ComponentFixture<CapturaCamara>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CapturaCamara]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CapturaCamara);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
