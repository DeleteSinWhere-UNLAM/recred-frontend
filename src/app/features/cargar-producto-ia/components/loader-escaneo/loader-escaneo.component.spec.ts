import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoaderEscaneoComponent } from './loader-escaneo.component';

describe('LoaderEscaneoComponent', () => {
  let component: LoaderEscaneoComponent;
  let fixture: ComponentFixture<LoaderEscaneoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoaderEscaneoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoaderEscaneoComponent);
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
