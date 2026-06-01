import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CameraCapture } from './camera-capture';

describe('CameraCapture', () => {
  let component: CameraCapture;
  let fixture: ComponentFixture<CameraCapture>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CameraCapture]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CameraCapture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
