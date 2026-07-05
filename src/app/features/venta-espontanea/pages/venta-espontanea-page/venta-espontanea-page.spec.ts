import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VentaEspontaneaPage } from './venta-espontanea-page';

describe('VentaEspontaneaPage', () => {
  let component: VentaEspontaneaPage;
  let fixture: ComponentFixture<VentaEspontaneaPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentaEspontaneaPage],
    }).compileComponents();

    fixture = TestBed.createComponent(VentaEspontaneaPage);
    component = fixture.componentInstance;
  });

  describe('inicializacion', () => {
    it('dado el componente, cuando se monta, deberia crearse', () => {
      whenMonto();

      expect(component).toBeTruthy();
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
