import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MensajeAsistenteMother } from '../../asistente-virtual.mother';
import { MensajeAsistente } from '../../models/mensaje-asistente.model';
import {
  AccionAsistente,
  ESTADO_COMPRA_CANCELADO,
  TIPO_ACCION_CANCELACION_COMPRA,
} from '../../models/respuesta-asistente.model';
import { MensajeBurbujaComponent } from './mensaje-burbuja.component';

interface GettersPrivados {
  esUsuario: boolean;
  horaFormateada: string;
  accion: AccionAsistente | null;
  estadoCompraTexto: string;
  totalFormateado: string | null;
  muestraComprobante: boolean;
  muestraCancelacionCompra: boolean;
  valorTexto(v: string | number | null | undefined): string;
}

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

  describe('render del comprobante y la cancelacion', () => {
    it('dado una accion ejecutada con datos de compra, cuando se renderiza, deberia mostrar el comprobante con el codigo de retiro', () => {
      givenMensaje(
        MensajeAsistenteMother.crearCred({
          accion: {
            estado: 'EJECUTADA',
            compraId: 'compra-1',
            estadoCompra: 'PENDIENTE',
            codigoRetiro: 'ABC123',
            recreo: 'Primer recreo',
            total: 1500,
          },
        }),
      );

      whenRenderizo();

      thenElContenidoContiene('Compra confirmada');
      thenElContenidoContiene('ABC123');
    });

    it('dado una accion de tipo CANCELACION_COMPRA, cuando se renderiza, deberia mostrar la cancelacion y no el comprobante', () => {
      givenMensaje(
        MensajeAsistenteMother.crearCred({
          texto: 'Tu compra fue cancelada.',
          accion: {
            tipo: TIPO_ACCION_CANCELACION_COMPRA,
            estado: 'EJECUTADA',
            compraId: 'compra-1',
            estadoCompra: ESTADO_COMPRA_CANCELADO,
          },
        }),
      );

      whenRenderizo();

      thenElContenidoContiene('Compra cancelada');
      thenElContenidoContiene('CANCELADO');
      thenElContenidoNoContiene('Compra confirmada');
    });

    it('dado una cancelacion informativa, cuando se renderiza, no deberia mostrar comprobante ni cancelacion', () => {
      givenMensaje(
        MensajeAsistenteMother.crearCred({
          texto: 'Tenes mas de una compra pendiente.',
          accion: {
            tipo: TIPO_ACCION_CANCELACION_COMPRA,
            estado: 'INFORMATIVA',
          },
        }),
      );

      whenRenderizo();

      thenElContenidoNoContiene('Compra cancelada');
      thenElContenidoNoContiene('Compra confirmada');
    });

    it('dado una accion sin tipo pero con estadoCompra CANCELADO, cuando se renderiza, deberia mostrar la cancelacion', () => {
      givenMensaje(
        MensajeAsistenteMother.crearCred({
          accion: { estado: 'EJECUTADA', estadoCompra: ESTADO_COMPRA_CANCELADO },
        }),
      );

      whenRenderizo();

      thenElContenidoContiene('Compra cancelada');
    });

    it('dado una accion con solo status en lugar de estado, cuando se renderiza, deberia usar status como estadoAccion', () => {
      givenMensaje(
        MensajeAsistenteMother.crearCred({
          accion: {
            status: 'EJECUTADA',
            compraId: 'c-1',
            codigoRetiro: 'ABC',
          },
        }),
      );

      whenRenderizo();

      thenElContenidoContiene('ABC');
    });
  });

  describe('getters puntuales', () => {
    it('dado un mensaje sin accion, cuando leo el getter accion, deberia devolver null', () => {
      givenMensaje(MensajeAsistenteMother.crearCred({ accion: undefined }));

      thenElGetter('accion').esNull();
    });

    it('dado un mensaje del rol usuario, cuando leo esUsuario, deberia ser true y muestraComprobante false', () => {
      givenMensaje(MensajeAsistenteMother.crearUsuario());

      thenElGetter('esUsuario').esTrue();
      thenElGetter('muestraComprobante').esFalse();
      thenElGetter('muestraCancelacionCompra').esFalse();
    });

    it('dado una fechaHora concreta, cuando leo horaFormateada, deberia matchear el formato HH:MM', () => {
      givenMensaje(MensajeAsistenteMother.crearCred({ fechaHora: new Date('2026-06-30T14:05:00') }));

      thenHoraFormateadaMatcheaHhMm();
    });

    it('dado una accion sin estado ni status, cuando leo muestraComprobante, deberia ser false', () => {
      givenMensaje(MensajeAsistenteMother.crearCred({
        accion: { compraId: 'c-1', codigoRetiro: 'ABC' },
      }));

      thenElGetter('muestraComprobante').esFalse();
    });

    it('dado una accion sin total, cuando leo totalFormateado, deberia ser null', () => {
      givenMensaje(MensajeAsistenteMother.crearCred({ accion: { estado: 'EJECUTADA' } }));

      thenElGetter('totalFormateado').esNull();
    });

    it('dado una accion con total 0, cuando leo totalFormateado, deberia formatearlo como ARS conteniendo "0"', () => {
      givenMensaje(MensajeAsistenteMother.crearCred({ accion: { estado: 'EJECUTADA', total: 0 } }));

      thenTotalFormateadoContiene('0');
    });

    it('dado estadoCompra ausente, cuando leo estadoCompraTexto, deberia devolver "-"', () => {
      givenMensaje(MensajeAsistenteMother.crearCred({ accion: { estado: 'EJECUTADA' } }));

      thenEstadoCompraTextoEs('-');
    });

    it('dado un estadoCompra con espacios, cuando leo estadoCompraTexto, deberia devolverlo trimmeado', () => {
      givenMensaje(
        MensajeAsistenteMother.crearCred({
          accion: { estado: 'EJECUTADA', estadoCompra: '  PENDIENTE  ' },
        }),
      );

      thenEstadoCompraTextoEs('PENDIENTE');
    });

    it('dado null, undefined, string vacio y solo espacios, cuando llamo valorTexto, deberia devolver "-"', () => {
      givenMensaje(MensajeAsistenteMother.crearCred());

      thenValorTextoEs(null, '-');
      thenValorTextoEs(undefined, '-');
      thenValorTextoEs('', '-');
      thenValorTextoEs('   ', '-');
    });

    it('dado un numero, cuando llamo valorTexto, deberia devolverlo como string', () => {
      givenMensaje(MensajeAsistenteMother.crearCred());

      thenValorTextoEs(42, '42');
    });
  });

  describe('tieneDatosComprobanteCompra — short-circuits de la OR', () => {
    it('dado una accion ejecutada con solo compraId, cuando reviso muestraComprobante, deberia ser true', () => {
      givenMensaje(
        MensajeAsistenteMother.crearCred({ accion: { estado: 'EJECUTADA', compraId: 'c-1' } }),
      );

      thenElGetter('muestraComprobante').esTrue();
    });

    it('dado una accion ejecutada con solo codigoRetiro, cuando reviso muestraComprobante, deberia ser true', () => {
      givenMensaje(
        MensajeAsistenteMother.crearCred({ accion: { estado: 'EJECUTADA', codigoRetiro: 'ABC' } }),
      );

      thenElGetter('muestraComprobante').esTrue();
    });

    it('dado una accion ejecutada con solo estadoCompra, cuando reviso muestraComprobante, deberia ser true', () => {
      givenMensaje(
        MensajeAsistenteMother.crearCred({ accion: { estado: 'EJECUTADA', estadoCompra: 'PENDIENTE' } }),
      );

      thenElGetter('muestraComprobante').esTrue();
    });

    it('dado una accion ejecutada con solo recreo, cuando reviso muestraComprobante, deberia ser true', () => {
      givenMensaje(
        MensajeAsistenteMother.crearCred({ accion: { estado: 'EJECUTADA', recreo: 'Primer recreo' } }),
      );

      thenElGetter('muestraComprobante').esTrue();
    });

    it('dado una accion ejecutada con solo total, cuando reviso muestraComprobante, deberia ser true', () => {
      givenMensaje(
        MensajeAsistenteMother.crearCred({ accion: { estado: 'EJECUTADA', total: 100 } }),
      );

      thenElGetter('muestraComprobante').esTrue();
    });

    it('dado una accion ejecutada sin ningun dato de compra, cuando reviso muestraComprobante, deberia ser false', () => {
      givenMensaje(MensajeAsistenteMother.crearCred({ accion: { estado: 'EJECUTADA' } }));

      thenElGetter('muestraComprobante').esFalse();
    });
  });

  function givenMensaje(mensaje: MensajeAsistente): void {
    component.mensaje = mensaje;
  }

  function whenRenderizo(): void {
    fixture.detectChanges();
  }

  function priv(): GettersPrivados {
    return component as unknown as GettersPrivados;
  }

  function contenido(): string {
    whenRenderizo();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function thenElContenidoContiene(texto: string): void {
    expect(contenido()).toContain(texto);
  }

  function thenElContenidoNoContiene(texto: string): void {
    expect(contenido()).not.toContain(texto);
  }

  function thenElGetter(nombre: 'esUsuario' | 'muestraComprobante' | 'muestraCancelacionCompra' | 'accion' | 'totalFormateado'): {
    esTrue(): void;
    esFalse(): void;
    esNull(): void;
  } {
    return {
      esTrue: () => expect(priv()[nombre]).toBeTrue(),
      esFalse: () => expect(priv()[nombre]).toBeFalse(),
      esNull: () => expect(priv()[nombre]).toBeNull(),
    };
  }

  function thenHoraFormateadaMatcheaHhMm(): void {
    expect(priv().horaFormateada).toMatch(/\d{2}:\d{2}/);
  }

  function thenTotalFormateadoContiene(fragmento: string): void {
    expect(priv().totalFormateado).toContain(fragmento);
  }

  function thenEstadoCompraTextoEs(esperado: string): void {
    expect(priv().estadoCompraTexto).toBe(esperado);
  }

  function thenValorTextoEs(entrada: string | number | null | undefined, esperado: string): void {
    expect(priv().valorTexto(entrada)).toBe(esperado);
  }
});
