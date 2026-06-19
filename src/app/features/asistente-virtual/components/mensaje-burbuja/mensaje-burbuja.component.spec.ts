import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MensajeBurbujaComponent } from './mensaje-burbuja.component';

describe('MensajeBurbujaComponent', () => {
  let component: MensajeBurbujaComponent;
  let fixture: ComponentFixture<MensajeBurbujaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MensajeBurbujaComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MensajeBurbujaComponent);
    component = fixture.componentInstance;
  });

  it('dado que el rol es usuario, esUsuario deberia ser true', () => {
    component.mensaje = { id: '1', rol: 'usuario', texto: '', fechaHora: new Date() };
    expect(component['esUsuario']).toBeTrue();
  });

  it('dado que el rol no es usuario, esUsuario deberia ser false', () => {
    component.mensaje = { id: '1', rol: 'cred', texto: '', fechaHora: new Date(), generadoPorIa: false };
    expect(component['esUsuario']).toBeFalse();
  });

  it('dado que se provee una fecha, la horaFormateada deberia ser el formato HH:mm', () => {
    const d = new Date();
    spyOn(d, 'toLocaleTimeString').and.returnValue('14:05');
    component.mensaje = { id: '1', rol: 'usuario', texto: '', fechaHora: d };
    expect(component['horaFormateada']).toBe('14:05');
  });

  it('dado que el mensaje tiene una accion ejecutada y no es usuario, muestraComprobante deberia ser true', () => {
    component.mensaje = { id: '1', rol: 'cred', texto: '', fechaHora: new Date(), generadoPorIa: false, accion: { estado: 'EJECUTADA', tipo: 'VENDER' } };
    expect(component['muestraComprobante']).toBeTrue();
  });

  it('dado que el mensaje tiene total, totalFormateado deberia tener formato de moneda argentina', () => {
    component.mensaje = { id: '1', rol: 'cred', texto: '', fechaHora: new Date(), generadoPorIa: false, accion: { estado: 'EJECUTADA', tipo: 'VENDER', total: 1500 } };
    expect(component['totalFormateado']).toContain('1.500');
    expect(component['totalFormateado']).toContain('$');
  });

  it('dado que el mensaje no tiene total, totalFormateado deberia ser null', () => {
    component.mensaje = { id: '1', rol: 'cred', texto: '', fechaHora: new Date(), generadoPorIa: false, accion: { estado: 'EJECUTADA', tipo: 'VENDER' } };
    expect(component['totalFormateado']).toBeNull();
  });

  it('dado que se pide formatear un valor nulo, valorTexto deberia retornar guion', () => {
    component.mensaje = { id: '1', rol: 'usuario', texto: '', fechaHora: new Date() };
    expect(component['valorTexto'](null)).toBe('-');
    expect(component['valorTexto'](undefined)).toBe('-');
    expect(component['valorTexto']('   ')).toBe('-');
  });

  it('dado que se pide formatear un valor valido, valorTexto deberia retornarlo', () => {
    component.mensaje = { id: '1', rol: 'usuario', texto: '', fechaHora: new Date() };
    expect(component['valorTexto']('Test')).toBe('Test');
    expect(component['valorTexto'](123)).toBe('123');
  });
});
