import { ComponentFixture, TestBed } from '@angular/core/testing';
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
      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('Ir al buffet');
      expect(texto).toContain('Hacé tu pedido');
    });

    it('dado una accion con color menta, deberia aplicar la clase accion-tile--menta', () => {
      const button = (fixture.nativeElement as HTMLElement).querySelector('button');
      expect(button?.classList.contains('accion-tile--menta')).toBeTrue();
    });

    it('dado una accion sin ruta, deberia mostrar el badge "Próximamente"', () => {
      fixture.componentRef.setInput('accion', AccionRapidaMother.crearBuffet({ ruta: null }));
      fixture.detectChanges();

      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('Próximamente');
    });

    it('dado una accion con ruta, no deberia mostrar el badge "Próximamente"', () => {
      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).not.toContain('Próximamente');
    });
  });

  describe('interaccion', () => {
    it('dado una accion, cuando hago click en el tile, deberia emitir seleccionar con la accion', () => {
      const spy = jasmine.createSpy('seleccionar');
      component.seleccionar.subscribe(spy);

      (fixture.nativeElement as HTMLElement).querySelector('button')!.click();

      expect(spy).toHaveBeenCalledWith(component.accion);
    });
  });
});
