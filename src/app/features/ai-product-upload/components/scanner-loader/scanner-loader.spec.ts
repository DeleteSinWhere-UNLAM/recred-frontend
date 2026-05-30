import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScannerLoader } from './scanner-loader';

describe('ScannerLoader', () => {
  let component: ScannerLoader;
  let fixture: ComponentFixture<ScannerLoader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerLoader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScannerLoader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
