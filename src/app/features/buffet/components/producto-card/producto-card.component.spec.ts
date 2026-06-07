import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ProductoCardComponent } from './producto-card.component';
import { CarritoService } from '../../../compra/services/carrito.service';
import { Producto } from '../../models/producto.model';

describe('ProductoCardComponent', () => {
  let component: ProductoCardComponent;
  let fixture: ComponentFixture<ProductoCardComponent>;
  let carritoServiceSpy: jasmine.SpyObj<CarritoService>;

  const mockProducto: Producto = {
    id: 'prod-123',
    nombre: 'Sándwich de Jamón y Queso',
    descripcion: 'Delicioso tostado de jamón y queso',
    precio: 1200,
    categoria: { id: 'comidas', descripcion: 'Comidas' },
    clasificacionesSalud: [{ id: 'sin-tacc', descripcion: 'Sin TACC' }],
    imagen: 'sandwich.jpg',
    estadoStock: 'DISPONIBLE',
    bloqueado: false
  };

  beforeEach(async () => {
    carritoServiceSpy = jasmine.createSpyObj<CarritoService>('CarritoService', [
      'cantidadDe'
    ]);
    carritoServiceSpy.cantidadDe.and.returnValue(0);

    await TestBed.configureTestingModule({
      imports: [ProductoCardComponent],
      providers: [
        { provide: CarritoService, useValue: carritoServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductoCardComponent);
    component = fixture.componentInstance;
    component.producto = mockProducto;
    component.alumnoId = 'alumno-abc';
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Candado / Control Parental', () => {
    it('no debería mostrar el botón del candado si mostrarCandado es false', () => {
      fixture.componentRef.setInput('mostrarCandado', false);
      fixture.detectChanges();

      const lockBtn = fixture.debugElement.query(By.css('.producto-card__lock-btn'));
      expect(lockBtn).toBeNull();
    });

    it('debería mostrar el botón del candado si mostrarCandado es true', () => {
      fixture.componentRef.setInput('mostrarCandado', true);
      fixture.detectChanges();

      const lockBtn = fixture.debugElement.query(By.css('.producto-card__lock-btn'));
      expect(lockBtn).not.toBeNull();
    });

    it('debería emitir el evento toggleLock al hacer clic en el candado', () => {
      fixture.componentRef.setInput('mostrarCandado', true);
      fixture.detectChanges();

      spyOn(component.toggleLock, 'emit');

      const lockBtn = fixture.debugElement.query(By.css('.producto-card__lock-btn'));
      lockBtn.triggerEventHandler('click', new MouseEvent('click'));

      expect(component.toggleLock.emit).toHaveBeenCalledWith(mockProducto);
    });

    it('debería renderizar el candado abierto si no está bloqueado', () => {
      fixture.componentRef.setInput('mostrarCandado', true);
      fixture.componentRef.setInput('producto', { ...mockProducto, bloqueado: false });
      fixture.detectChanges();

      const lockIcon = fixture.debugElement.query(By.css('.producto-card__lock-btn i'));
      expect(lockIcon.nativeElement.classList.contains('fa-lock-open')).toBeTrue();
      expect(lockIcon.nativeElement.classList.contains('fa-lock')).toBeFalse();
    });

    it('debería renderizar el candado cerrado y con la clase de bloqueado si está bloqueado', () => {
      fixture.componentRef.setInput('mostrarCandado', true);
      fixture.componentRef.setInput('producto', { ...mockProducto, bloqueado: true });
      fixture.detectChanges();

      const lockBtn = fixture.debugElement.query(By.css('.producto-card__lock-btn'));
      const lockIcon = lockBtn.query(By.css('i'));

      expect(lockIcon.nativeElement.classList.contains('fa-lock')).toBeTrue();
      expect(lockIcon.nativeElement.classList.contains('fa-lock-open')).toBeFalse();
      expect(lockBtn.nativeElement.classList.contains('producto-card__lock-btn--bloqueado')).toBeTrue();
    });

    it('debería mostrar el botón "Bloqueado" y deshabilitado si está bloqueado', () => {
      fixture.componentRef.setInput('producto', { ...mockProducto, bloqueado: true });
      fixture.detectChanges();

      const ctaBtn = fixture.debugElement.query(By.css('.producto-card__cta'));
      expect(ctaBtn.nativeElement.disabled).toBeTrue();
      expect(ctaBtn.nativeElement.textContent).toContain('Bloqueado');
    });

    it('debería desplazar el badge de salud si mostrarCandado es true', () => {
      fixture.componentRef.setInput('mostrarCandado', true);
      fixture.detectChanges();

      const badge = fixture.debugElement.query(By.css('.producto-card__badge'));
      expect(badge.nativeElement.classList.contains('producto-card__badge--shifted')).toBeTrue();
    });
  });
});
