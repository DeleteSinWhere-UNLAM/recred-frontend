import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MensajeBurbujaComponent } from './mensaje-burbuja.component';
import { MensajeAsistente } from '../../models/mensaje-asistente.model';
import {
  ESTADO_COMPRA_CANCELADO,
  TIPO_ACCION_CANCELACION_COMPRA,
} from '../../models/respuesta-asistente.model';

describe('MensajeBurbujaComponent', () => {
  let fixture: ComponentFixture<MensajeBurbujaComponent>;
  let component: MensajeBurbujaComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MensajeBurbujaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MensajeBurbujaComponent);
    component = fixture.componentInstance;
  });

  it('muestra comprobante cuando una compra se ejecuta', () => {
    component.mensaje = crearMensaje({
      accion: {
        estado: 'EJECUTADA',
        compraId: 'compra-1',
        estadoCompra: 'PENDIENTE',
        codigoRetiro: 'ABC123',
        recreo: 'Primer recreo',
        total: 1500,
      },
    });

    fixture.detectChanges();

    const texto = contenido();
    expect(texto).toContain('Compra confirmada');
    expect(texto).toContain('ABC123');
  });

  it('muestra cancelacion y no comprobante cuando la accion es CANCELACION_COMPRA', () => {
    component.mensaje = crearMensaje({
      texto: 'Tu compra fue cancelada.',
      accion: {
        tipo: TIPO_ACCION_CANCELACION_COMPRA,
        estado: 'EJECUTADA',
        compraId: 'compra-1',
        estadoCompra: ESTADO_COMPRA_CANCELADO,
      },
    });

    fixture.detectChanges();

    const texto = contenido();
    expect(texto).toContain('Compra cancelada');
    expect(texto).toContain('CANCELADO');
    expect(texto).not.toContain('Compra confirmada');
  });

  it('no muestra comprobante para cancelacion informativa', () => {
    component.mensaje = crearMensaje({
      texto: 'Tenes mas de una compra pendiente.',
      accion: {
        tipo: TIPO_ACCION_CANCELACION_COMPRA,
        estado: 'INFORMATIVA',
      },
    });

    fixture.detectChanges();

    const texto = contenido();
    expect(texto).not.toContain('Compra cancelada');
    expect(texto).not.toContain('Compra confirmada');
  });

  function contenido(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function crearMensaje(
    parcial: Partial<MensajeAsistente>,
  ): MensajeAsistente {
    return {
      id: 'msg-1',
      rol: 'cred',
      texto: 'Respuesta del asistente',
      fechaHora: new Date('2026-06-30T10:00:00'),
      ...parcial,
    };
  }
});
