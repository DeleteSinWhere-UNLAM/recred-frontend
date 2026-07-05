import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccionRapida } from '../../models/accion-rapida.model';
import { AccionRapidaMother } from '../../home-alumno.mother';
import { AccionTileComponent } from './accion-tile.component';

describe('AccionTileComponent', () => {
  let component: AccionTileComponent;
  let fixture: ComponentFixture<AccionTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccionTileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccionTileComponent);
    component = fixture.componentInstance;
    component.accion = AccionRapidaMother.crearBuffet();
    fixture.detectChanges();
  });

  describe('render', () => {
    it('dado una accion, cuando se monta, deberia mostrar el label y la descripcion', () => {
      const texto = textoDelTile();

      expect(texto).toContain('Ir al buffet');
      expect(texto).toContain('Hacé tu pedido');
    });

    it('dado una accion con color menta, cuando se monta, deberia aplicar la clase accion-tile--menta', () => {
      const button = buttonDelTile();

      expect(button?.classList.contains('accion-tile--menta')).toBeTrue();
    });

    it('dado una accion sin ruta, cuando se monta, deberia mostrar el badge "Próximamente"', () => {
      givenAccionCon(AccionRapidaMother.crearBuffet({ ruta: null }));

      expect(textoDelTile()).toContain('Próximamente');
    });

    it('dado una accion con ruta, cuando se monta, no deberia mostrar el badge "Próximamente"', () => {
      expect(textoDelTile()).not.toContain('Próximamente');
    });
  });

  describe('interaccion', () => {
    it('dado una accion, cuando hago click en el tile, deberia emitir seleccionar con la accion', () => {
      const spy = jasmine.createSpy('seleccionar');
      component.seleccionar.subscribe(spy);

      whenHagoClickEnElTile();

      expect(spy).toHaveBeenCalledWith(component.accion);
    });
  });

  function givenAccionCon(accion: AccionRapida): void {
    fixture.componentRef.setInput('accion', accion);
    fixture.detectChanges();
  }

  function whenHagoClickEnElTile(): void {
    buttonDelTile()!.click();
  }

  function textoDelTile(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function buttonDelTile(): HTMLButtonElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('button');
  }
});
