import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionPrecioCardComponent } from './notificacion-precio-card';
import { NotificacionPrecio } from '../../models/notificacion-precio.model';

describe('NotificacionPrecioCardComponent', () => {
  let componente: NotificacionPrecioCardComponent;
  let fixture: ComponentFixture<NotificacionPrecioCardComponent>;

  const mockNotificacion = {
    titulo: 'Subida de precio',
    mensaje: 'El alfajor triple aumentó un 20%',
    productoId: 'prod-alf-1',
    razonIA: 'Inflación en materia prima'
  } as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificacionPrecioCardComponent] // Es standalone
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacionPrecioCardComponent);
    componente = fixture.componentInstance;
    componente.notificacion = mockNotificacion;
    fixture.detectChanges();
  });

  it('dado que recibe una notificacion, debe renderizar titulo, mensaje, producto y razon', () => {
    const html = fixture.nativeElement.innerHTML;
    expect(html).toContain('Subida de precio');
    expect(html).toContain('aumentó un 20%');
    expect(html).toContain('prod-alf-1');
    expect(html).toContain('Inflación en materia prima');
  });
});
