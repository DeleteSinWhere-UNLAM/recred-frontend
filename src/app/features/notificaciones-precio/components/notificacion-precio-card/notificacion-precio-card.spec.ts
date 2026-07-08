import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionesPrecioMother } from '../../notificaciones-precio.mother';
import { NotificacionPrecio } from '../../models/notificacion-precio.model';
import { NotificacionPrecioCardComponent } from './notificacion-precio-card';

describe('NotificacionPrecioCardComponent', () => {
  let component: NotificacionPrecioCardComponent;
  let fixture: ComponentFixture<NotificacionPrecioCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificacionPrecioCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacionPrecioCardComponent);
    component = fixture.componentInstance;
  });

  describe('render con una notificacion', () => {
    it('dado una notificacion default, cuando renderizo, deberia mostrar el titulo', () => {
      whenRenderoCon(NotificacionesPrecioMother.crearNotificacion());

      expect(textoRenderizado()).toContain('Alfajor subió de precio');
    });

    it('dado una notificacion default, cuando renderizo, deberia mostrar el mensaje', () => {
      whenRenderoCon(NotificacionesPrecioMother.crearNotificacion());

      expect(textoRenderizado()).toContain('El alfajor aumentó un 20%');
    });

    it('dado una notificacion default, cuando renderizo, deberia mostrar el productoId', () => {
      whenRenderoCon(NotificacionesPrecioMother.crearNotificacion());

      expect(textoRenderizado()).toContain('prod-alfajor');
    });

    it('dado una notificacion default, cuando renderizo, deberia mostrar la razon (motivo)', () => {
      whenRenderoCon(NotificacionesPrecioMother.crearNotificacion());

      const texto = textoRenderizado();
      expect(texto).toContain('Motivo');
      expect(texto).toContain('Inflación local');
    });

    it('dado otra notificacion con override, cuando renderizo, deberia mostrar los datos del override', () => {
      whenRenderoCon(
        NotificacionesPrecioMother.crearNotificacion({
          titulo: 'Coca-Cola bajó de precio',
          mensaje: 'Precio -10%',
          productoId: 'prod-coca',
          razonIA: 'Promocion del proveedor',
        }),
      );

      const texto = textoRenderizado();
      expect(texto).toContain('Coca-Cola bajó de precio');
      expect(texto).toContain('Precio -10%');
      expect(texto).toContain('prod-coca');
      expect(texto).toContain('Promocion del proveedor');
    });
  });

  function whenRenderoCon(notificacion: NotificacionPrecio): void {
    component.notificacion = notificacion;
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
