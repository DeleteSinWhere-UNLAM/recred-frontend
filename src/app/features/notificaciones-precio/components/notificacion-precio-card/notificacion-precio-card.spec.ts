import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionPrecioCardComponent } from './notificacion-precio-card';
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
    it('debería inicializar el componente con la notificación asignada', () => {
      givenComponenteCreado();
      whenAsignoNotificacion();
      thenElComponenteSeInicializaCorrectamente();
    });
  });

  function givenComponenteCreado(): void {
    fixture = TestBed.createComponent(NotificacionPrecioCardComponent);
    component = fixture.componentInstance;
  }

  function whenAsignoNotificacion(): void {
    component.notificacion = NotificacionesPrecioMother.crearNotificacion();
    fixture.detectChanges();
  }

  function thenElComponenteSeInicializaCorrectamente(): void {
    expect(component).toBeTruthy();
    expect(component.notificacion.titulo).toBe('Alfajor subió de precio');
  }
});
