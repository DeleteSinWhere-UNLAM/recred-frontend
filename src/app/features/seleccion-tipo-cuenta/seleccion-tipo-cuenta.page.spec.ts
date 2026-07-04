import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeleccionTipoCuentaPage } from './seleccion-tipo-cuenta.page';

describe('SeleccionTipoCuentaPage', () => {
  let component: SeleccionTipoCuentaPage;
  let fixture: ComponentFixture<SeleccionTipoCuentaPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionTipoCuentaPage],
    }).compileComponents();

    fixture = TestBed.createComponent(SeleccionTipoCuentaPage);
    component = fixture.componentInstance;
  });

  describe('inicializacion', () => {
    it('deberia crear el componente', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('render', () => {
    it('dado que la pantalla esta en construccion, cuando se monta, deberia mostrar el titulo de bienvenida', () => {
      whenMonto();

      const texto = thenTextoDelDom();
      expect(texto).toContain('Bienvenido a RECRED');
    });

    it('dado que la pantalla esta en construccion, cuando se monta, deberia pedir al usuario elegir tipo de cuenta', () => {
      whenMonto();

      const texto = thenTextoDelDom();
      expect(texto).toContain('elegí qué tipo de usuario sos');
    });

    it('dado que el endpoint no esta listo, cuando se monta, deberia mostrar la nota de pantalla en construccion', () => {
      whenMonto();

      const nota = (fixture.nativeElement as HTMLElement).querySelector('.placeholder__nota');
      expect(nota?.textContent).toContain('Pantalla en construcción');
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function thenTextoDelDom(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
