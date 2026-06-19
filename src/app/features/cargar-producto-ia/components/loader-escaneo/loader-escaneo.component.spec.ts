import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScannerLoader } from './scanner-loader';

describe('ScannerLoader', () => {
  let component: ScannerLoader;
  let fixture: ComponentFixture<ScannerLoader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerLoader]
    }).compileComponents();

    fixture = TestBed.createComponent(ScannerLoader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se instancia el componente, isScanning deberia ser false por defecto', () => {
    expect(component.isScanning).toBeFalse();
  });

  it('dado que se inyecta el Input isScanning en true, el valor se deberia actualizar', () => {
    component.isScanning = true;
    fixture.detectChanges();
    expect(component.isScanning).toBeTrue();
  });
});
