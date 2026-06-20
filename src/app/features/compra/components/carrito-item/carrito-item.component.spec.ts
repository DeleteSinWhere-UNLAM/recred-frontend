import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CarritoItemComponent } from './carrito-item.component';
import { CarritoService } from '../../services/carrito.service';
import { ItemCarrito } from '../../models/carrito.model';
import { Producto } from '../../../buffet/models/producto.model';

// ─── Datos de prueba ────────────────────────────────────────────────────────

const productoBase: Producto = {
  id: 'prod-1',
  nombre: 'Empanada de jamón',
  descripcion: 'Rica empanada',
  precio: 500,
  categoria: { id: 'cat-1', descripcion: 'Comidas' },
  clasificacionesSalud: [],
  imagen: 'https://example.com/foto.jpg',
  estadoStock: 'DISPONIBLE',
};

const itemBase: ItemCarrito = {
  id: 'item-1',
  alumnoId: 'alumno-1',
  producto: productoBase,
  cantidad: 2,
};

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('CarritoItemComponent', () => {
  let componente: CarritoItemComponent;
  let fixture: ComponentFixture<CarritoItemComponent>;
  let servicioCarritoSpy: jasmine.SpyObj<CarritoService>;

  beforeEach(async () => {
    servicioCarritoSpy = jasmine.createSpyObj<CarritoService>('CarritoService', [
      'puedeAgregar',
    ]);
    // Por defecto se puede agregar
    servicioCarritoSpy.puedeAgregar.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [CarritoItemComponent],
      providers: [
        { provide: CarritoService, useValue: servicioCarritoSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CarritoItemComponent);
    componente = fixture.componentInstance;

    // Input requerido
    fixture.componentRef.setInput('item', itemBase);
    fixture.detectChanges();
  });

  // ── Creación ─────────────────────────────────────────────────────────────

  it('dado que se inicializa, debe crearse correctamente', () => {
    expect(componente).toBeTruthy();
  });

  // ── @Input() item ────────────────────────────────────────────────────────

  it('dado que recibe un item, debe reflejar el item actual en el signal', () => {
    expect(componente.itemActual()).toEqual(itemBase);
  });

  it('dado que se actualiza el item, debe actualizar el signal itemActual', () => {
    const itemActualizado: ItemCarrito = { ...itemBase, cantidad: 5 };
    fixture.componentRef.setInput('item', itemActualizado);
    fixture.detectChanges();
    expect(componente.itemActual()?.cantidad).toBe(5);
  });

  // ── Computed: precioFormateado ────────────────────────────────────────────

  it('dado que el item tiene precio 500, debe formatear el precio como $ 500', () => {
    expect(componente.precioFormateado()).toContain('500');
  });

  // ── Computed: subtotalFormateado ──────────────────────────────────────────

  it('dado que el item tiene precio 500 y cantidad 2, debe calcular subtotal como $ 1.000', () => {
    expect(componente.subtotalFormateado()).toContain('1.000');
  });

  // ── Computed: deshabilitarSumar ───────────────────────────────────────────

  it('dado que puedeAgregar devuelve true, debe retornar deshabilitarSumar en false', () => {
    servicioCarritoSpy.puedeAgregar.and.returnValue(true);
    fixture.componentRef.setInput('item', { ...itemBase });
    fixture.detectChanges();
    expect(componente.deshabilitarSumar()).toBeFalse();
  });

  it('dado que puedeAgregar devuelve false, debe retornar deshabilitarSumar en true', () => {
    servicioCarritoSpy.puedeAgregar.and.returnValue(false);
    fixture.componentRef.setInput('item', { ...itemBase });
    fixture.detectChanges();
    expect(componente.deshabilitarSumar()).toBeTrue();
  });

  // ── Template: renderizado del bloque @if ─────────────────────────────────

  it('dado que el item está definido, debe renderizar el bloque de contenido', () => {
    const elemento = fixture.debugElement.query(By.css('.carrito-item'));
    expect(elemento).not.toBeNull();
  });

  it('dado que el item NO está definido (undefined interno), no debe renderizar el bloque', () => {
    // Creamos un fixture limpio sin asignar item
    const fixtureVacio = TestBed.createComponent(CarritoItemComponent);
    fixtureVacio.componentRef.setInput('item', undefined);
    fixtureVacio.detectChanges();
    const elemento = fixtureVacio.debugElement.query(By.css('.carrito-item'));
    expect(elemento).toBeNull();
  });

  // ── Template: nombre y categoría ─────────────────────────────────────────

  it('dado que el item tiene nombre, debe mostrarlo en el template', () => {
    const nombre = fixture.debugElement.query(By.css('.carrito-item__nombre'));
    expect(nombre.nativeElement.textContent).toContain('Empanada de jamón');
  });

  it('dado que el item tiene categoría, debe mostrarla en el template', () => {
    const categoria = fixture.debugElement.query(By.css('.carrito-item__categoria'));
    expect(categoria.nativeElement.textContent).toContain('Comidas');
  });

  // ── Template: cantidad ───────────────────────────────────────────────────

  it('dado que el item tiene cantidad 2, debe mostrar "2" en el span de cantidad', () => {
    const cantidad = fixture.debugElement.query(By.css('.carrito-item__qty-valor'));
    expect(cantidad.nativeElement.textContent.trim()).toBe('2');
  });

  // ── @Output() sumar ──────────────────────────────────────────────────────

  it('dado que se hace clic en el botón sumar, debe emitir el id del item', () => {
    let idEmitido: string | undefined;
    componente.sumar.subscribe((id: string) => (idEmitido = id));

    const botonSumar = fixture.debugElement.query(
      By.css('button[aria-label="Sumar uno"]')
    );
    botonSumar.nativeElement.click();

    expect(idEmitido).toBe('item-1');
  });

  // ── @Output() restar ─────────────────────────────────────────────────────

  it('dado que se hace clic en el botón restar, debe emitir el id del item', () => {
    let idEmitido: string | undefined;
    componente.restar.subscribe((id: string) => (idEmitido = id));

    const botonRestar = fixture.debugElement.query(
      By.css('button[aria-label="Restar uno"]')
    );
    botonRestar.nativeElement.click();

    expect(idEmitido).toBe('item-1');
  });

  // ── @Output() eliminar ────────────────────────────────────────────────────

  it('dado que se hace clic en el botón eliminar, debe emitir el id del item', () => {
    let idEmitido: string | undefined;
    componente.eliminar.subscribe((id: string) => (idEmitido = id));

    const botonEliminar = fixture.debugElement.query(
      By.css('button[aria-label="Eliminar del carrito"]')
    );
    botonEliminar.nativeElement.click();

    expect(idEmitido).toBe('item-1');
  });

  // ── Template: botón sumar deshabilitado ──────────────────────────────────

  it('dado que deshabilitarSumar es true, el botón sumar debe estar deshabilitado', () => {
    servicioCarritoSpy.puedeAgregar.and.returnValue(false);
    fixture.componentRef.setInput('item', { ...itemBase });
    fixture.detectChanges();

    const botonSumar = fixture.debugElement.query(
      By.css('button[aria-label="Sumar uno"]')
    ).nativeElement as HTMLButtonElement;
    expect(botonSumar.disabled).toBeTrue();
  });

  it('dado que deshabilitarSumar es false, el botón sumar debe estar habilitado', () => {
    servicioCarritoSpy.puedeAgregar.and.returnValue(true);
    fixture.componentRef.setInput('item', { ...itemBase });
    fixture.detectChanges();

    const botonSumar = fixture.debugElement.query(
      By.css('button[aria-label="Sumar uno"]')
    ).nativeElement as HTMLButtonElement;
    expect(botonSumar.disabled).toBeFalse();
  });

  // ── Template: imagen con fallback ────────────────────────────────────────

  it('dado que ocurre un error en la imagen, onImagenError debe asignar el fallback SVG', () => {
    const imgEl = document.createElement('img');
    imgEl.src = 'https://roto.com/img.jpg';
    const evento = new Event('error');
    Object.defineProperty(evento, 'target', { value: imgEl });

    // Llamada directa al método protegido mediante cast
    (componente as unknown as { onImagenError: (e: Event) => void }).onImagenError(evento);

    expect(imgEl.src).toContain('data:image/svg+xml');
  });

  it('dado que la imagen ya es el fallback, onImagenError no debe reasignarlo', () => {
    const imgEl = document.createElement('img');
    const evento = { target: imgEl } as unknown as Event;
    
    // Llamada inicial para asignar el fallback
    (componente as any).onImagenError(evento);
    
    const setSpy = spyOnProperty(imgEl, 'src', 'set');
    (componente as any).onImagenError(evento);

    expect(setSpy).not.toHaveBeenCalled();
  });

  // ── Llamada al servicio ───────────────────────────────────────────────────

  it('dado que el componente se inicializa, debe consultar puedeAgregar con los parámetros correctos', () => {
    // Al acceder al computed se invoca puedeAgregar
    componente.deshabilitarSumar();
    expect(servicioCarritoSpy.puedeAgregar).toHaveBeenCalledWith(
      productoBase,
      'alumno-1',
      1
    );
  });
});
