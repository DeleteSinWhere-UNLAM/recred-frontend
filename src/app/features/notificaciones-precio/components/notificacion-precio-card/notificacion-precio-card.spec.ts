import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionPrecioCardComponent } from './notificacion-precio-card';
import { NotificacionPrecio } from '../../models/notificacion-precio.model';
import { NotificacionesPrecioMother } from '../../notificaciones-precio.mother';



describe('NotificacionPrecioCardComponent', () => {
  let component: NotificacionPrecioCardComponent;
  let fixture: ComponentFixture<NotificacionPrecioCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificacionPrecioCardComponent]
    }).compileComponents();
  });

  describe('Inicialización', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(NotificacionPrecioCardComponent);
      component = fixture.componentInstance;
      component.notificacion = NotificacionesPrecioMother.crearNotificacion();
      fixture.detectChanges();
    });

    it('debería inicializar el componente con la notificación asignada', () => {
      
      const titulo = component.notificacion.titulo;

      expect(component).toBeTruthy();
      expect(titulo).toBe('Alfajor subió de precio');
    });
  });
});
