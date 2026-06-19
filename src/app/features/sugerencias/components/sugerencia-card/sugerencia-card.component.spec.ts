import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SugerenciaCardComponent } from './sugerencia-card.component';
import { SugerenciaProducto } from '../../models/sugerencia-producto.model';

describe('SugerenciaCardComponent', () => {
  let componente: SugerenciaCardComponent;
  let fixture: ComponentFixture<SugerenciaCardComponent>;

  const mockSugerencia: SugerenciaProducto = {
    productoOriginal: 'Gaseosa',
    alertas: [{ mensaje: 'Bajo stock', tipo: 'STOCK' } as any],
    estadisticasVenta: {
      categoria: 'Bebidas',
      diasSinVenta: 10,
      ventasPeriodo: 5,
      stockActual: 2
    }
  } as SugerenciaProducto;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SugerenciaCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SugerenciaCardComponent);
    componente = fixture.componentInstance;
    componente.sugerencia = mockSugerencia;
    fixture.detectChanges();
  });

  it('dado que se renderiza, debe mostrar la sugerencia y sus stats', () => {
    const html = fixture.nativeElement.innerHTML;
    expect(html).toContain('Gaseosa');
    expect(html).toContain('Bebidas');
    expect(html).toContain('10 días'); // dias sin venta
    // alertas.length es 1
    expect(html).toContain('1');
  });

  it('dado diasSinVenta >= 15, debe agregar la clase css --critical', () => {
    componente.sugerencia = {
      ...mockSugerencia,
      estadisticasVenta: { ...mockSugerencia.estadisticasVenta, diasSinVenta: 16 }
    };
    fixture.detectChanges();

    const statusEl = fixture.nativeElement.querySelector('.sugerencia-card__status');
    expect(statusEl.classList.contains('sugerencia-card__status--critical')).toBeTrue();
  });

  it('dado seleccionada = true, debe agregar la clase --selected', () => {
    componente.seleccionada = true;
    fixture.detectChanges();

    const cardEl = fixture.nativeElement.querySelector('.sugerencia-card');
    expect(cardEl.classList.contains('sugerencia-card--selected')).toBeTrue();
  });

  it('dado que se hace click o se pulsa teclado, debe emitir seleccionar', () => {
    spyOn(componente.seleccionar, 'emit');

    componente.onSeleccionar();

    expect(componente.seleccionar.emit).toHaveBeenCalledWith(mockSugerencia);
  });
});
