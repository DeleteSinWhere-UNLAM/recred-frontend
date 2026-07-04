import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EscanerLoader } from './escaner-loader';

describe('EscanerLoader', () => {
  let component: EscanerLoader;
  let fixture: ComponentFixture<EscanerLoader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EscanerLoader],
    }).compileComponents();

    fixture = TestBed.createComponent(EscanerLoader);
    component = fixture.componentInstance;
  });

  describe('Estado inicial', () => {
    it('dado el componente recien creado, isScanning deberia ser false por defecto', () => {
      expect(component.isScanning).toBeFalse();
    });
  });

  describe('render', () => {
    it('dado isScanning en false, no deberia renderizar el contenido del loader', () => {
      component.isScanning = false;
      fixture.detectChanges();

      thenElHostNoTieneContenidoActivo();
    });

    it('dado isScanning en true, deberia renderizar el loader activo', () => {
      component.isScanning = true;
      fixture.detectChanges();

      thenElHostTieneContenidoActivo();
    });
  });

  function thenElHostTieneContenidoActivo(): void {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  }

  function thenElHostNoTieneContenidoActivo(): void {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent?.trim() ?? '').toBe('');
  }
});
