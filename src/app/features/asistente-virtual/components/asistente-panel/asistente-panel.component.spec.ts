import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SugerenciaCapacidad } from '../../models/capacidad-asistente.model';
import { MensajeAsistente } from '../../models/mensaje-asistente.model';
import { AsistentePanelComponent } from './asistente-panel.component';

interface ProtegidoAsistente {
  onCerrar(): void;
  onEscape(): void;
  onEnviar(texto: string): void;
  onSugerencia(prompt: string): void;
  onNuevaConversacion(): void;
  onVerHistorial(): void;
  onToggleAcciones(): void;
  onOpcion(opcion: SugerenciaCapacidad): void;
  trackById(index: number, mensaje: MensajeAsistente): string;
  trackByGrupo(index: number, grupo: { id: string }): string;
  trackByOpcion(index: number, opcion: SugerenciaCapacidad): string;
  gruposOpciones(): readonly { id: string; label: string; opciones: readonly SugerenciaCapacidad[] }[];
  accionesAbiertas_(): boolean;
}

class SugerenciaCapacidadMother {
  static crear(override: Partial<SugerenciaCapacidad> = {}): SugerenciaCapacidad {
    return {
      id: 'op-1',
      capacidad: 'SALDO',
      label: 'Saldo',
      emoji: '$',
      prompt: 'saldo',
      ...override,
    };
  }
}

describe('AsistentePanelComponent', () => {
  let fixture: ComponentFixture<AsistentePanelComponent>;
  let component: AsistentePanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsistentePanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AsistentePanelComponent);
    component = fixture.componentInstance;
    component.mensajes = [];
    component.sugerencias = [];
  });

  describe('selector de fecha de retiro', () => {
    it('dado el selector visible con fecha minima 2026-07-03, cuando cambio la fecha al minimo, deberia emitirla', () => {
      givenSpyEnFechaRetiro();
      givenSelectorVisibleConMinimo('2026-07-03');

      whenCambioLaFechaEnElSelector('2026-07-03');

      thenSeEmitioFechaRetiro('2026-07-03');
    });

    it('dado el selector visible con fecha minima 2026-07-03, cuando elijo una anterior, no deberia emitirla', () => {
      givenSpyEnFechaRetiro();
      givenSelectorVisibleConMinimo('2026-07-03');

      whenCambioLaFechaEnElSelector('2026-07-02');

      thenNoSeEmitioFechaRetiro();
    });

    it('dado el selector visible pero deshabilitado, cuando cambio la fecha, no deberia emitirla', () => {
      givenSpyEnFechaRetiro();
      givenSelectorVisibleYDeshabilitado();

      whenCambioLaFechaEnElSelector('2026-07-10');

      thenNoSeEmitioFechaRetiro();
    });

    it('dado el selector visible, cuando el valor viene vacio, no deberia emitirlo', () => {
      givenSpyEnFechaRetiro();
      givenSelectorVisible();

      whenCambioLaFechaEnElSelector('');

      thenNoSeEmitioFechaRetiro();
    });
  });

  describe('emisiones simples', () => {
    it('cuando llamo onCerrar y onEscape, deberia emitir cerrar dos veces', () => {
      spyOn(component.cerrar, 'emit');

      whenLlamoProtegido('onCerrar');
      whenLlamoProtegido('onEscape');

      expect(component.cerrar.emit).toHaveBeenCalledTimes(2);
    });

    it('cuando llamo onEnviar con "hola", deberia reemitirlo al output enviar', () => {
      spyOn(component.enviar, 'emit');

      whenLlamoOnEnviar('hola');

      expect(component.enviar.emit).toHaveBeenCalledWith('hola');
    });

    it('cuando llamo onSugerencia con un prompt, deberia reemitirlo al output sugerencia', () => {
      spyOn(component.sugerencia, 'emit');

      whenLlamoOnSugerencia('saldo');

      expect(component.sugerencia.emit).toHaveBeenCalledWith('saldo');
    });

    it('cuando llamo onNuevaConversacion y onVerHistorial, deberian emitir sus outputs', () => {
      spyOn(component.nuevaConversacion, 'emit');
      spyOn(component.verHistorial, 'emit');

      whenLlamoProtegido('onNuevaConversacion');
      whenLlamoProtegido('onVerHistorial');

      expect(component.nuevaConversacion.emit).toHaveBeenCalled();
      expect(component.verHistorial.emit).toHaveBeenCalled();
    });
  });

  describe('acciones y opciones', () => {
    it('dado opciones vacias, cuando toggleo acciones, no deberia cambiar el estado', () => {
      givenOpciones([]);

      const antes = protegido().accionesAbiertas_();
      whenLlamoProtegido('onToggleAcciones');

      expect(protegido().accionesAbiertas_()).toBe(antes);
    });

    it('dado opciones no vacias, cuando toggleo acciones dos veces, deberia flipear la flag', () => {
      givenOpciones([SugerenciaCapacidadMother.crear()]);

      whenLlamoProtegido('onToggleAcciones');
      expect(protegido().accionesAbiertas_()).toBeFalse();

      whenLlamoProtegido('onToggleAcciones');
      expect(protegido().accionesAbiertas_()).toBeTrue();
    });

    it('dado deshabilitado true, cuando hago click en una opcion, no deberia emitir sugerencia', () => {
      spyOn(component.sugerencia, 'emit');
      givenDeshabilitado();

      whenLlamoOnOpcion(SugerenciaCapacidadMother.crear());

      expect(component.sugerencia.emit).not.toHaveBeenCalled();
    });

    it('dado una opcion bloqueada, cuando hago click, no deberia emitir sugerencia', () => {
      spyOn(component.sugerencia, 'emit');

      whenLlamoOnOpcion(SugerenciaCapacidadMother.crear({ bloqueada: true }));

      expect(component.sugerencia.emit).not.toHaveBeenCalled();
    });

    it('dado deshabilitado false, cuando hago click en una opcion, deberia cerrar acciones y emitir el prompt', () => {
      spyOn(component.sugerencia, 'emit');
      givenOpciones([SugerenciaCapacidadMother.crear()]);

      whenLlamoOnOpcion(SugerenciaCapacidadMother.crear({ prompt: 'ir' }));

      expect(protegido().accionesAbiertas_()).toBeFalse();
      expect(component.sugerencia.emit).toHaveBeenCalledWith('ir');
    });
  });

  describe('trackers', () => {
    it('cuando llamo trackById con un mensaje, deberia devolver su id', () => {
      const mensaje = { id: 'mensaje-1' } as MensajeAsistente;

      expect(protegido().trackById(0, mensaje)).toBe('mensaje-1');
    });

    it('cuando llamo trackByGrupo y trackByOpcion, deberian devolver el id respectivo', () => {
      expect(protegido().trackByGrupo(0, { id: 'cuenta' })).toBe('cuenta');
      expect(protegido().trackByOpcion(0, SugerenciaCapacidadMother.crear({ id: 'op-x' }))).toBe('op-x');
    });
  });

  describe('crearGruposOpciones', () => {
    it('dado opciones de distintas capacidades, cuando leo gruposOpciones, deberian estar en el orden esperado', () => {
      givenOpciones([
        SugerenciaCapacidadMother.crear({ id: 'saldo', capacidad: 'SALDO' }),
        SugerenciaCapacidadMother.crear({ id: 'compras', capacidad: 'COMPRAS' }),
        SugerenciaCapacidadMother.crear({ id: 'stock', capacidad: 'STOCK' }),
        SugerenciaCapacidadMother.crear({ id: 'raro', capacidad: undefined }),
      ]);

      const grupos = protegido().gruposOpciones();

      expect(grupos.map((g) => g.id)).toEqual(['cuenta', 'compras', 'buffet', 'general']);
      expect(grupos.find((g) => g.id === 'general')?.opciones.map((o) => o.id)).toEqual(['raro']);
    });

    it('dado opciones solo de la capacidad SALDO, cuando leo gruposOpciones, deberia devolver solo el grupo cuenta', () => {
      givenOpciones([SugerenciaCapacidadMother.crear({ capacidad: 'SALDO' })]);

      const grupos = protegido().gruposOpciones();

      expect(grupos.map((g) => g.id)).toEqual(['cuenta']);
    });
  });

  function protegido(): ProtegidoAsistente {
    return component as unknown as ProtegidoAsistente;
  }

  function givenSpyEnFechaRetiro(): void {
    spyOn(component.fechaRetiro, 'emit');
  }

  function givenSelectorVisible(): void {
    component.mostrarSelectorFechaRetiro = true;
    fixture.detectChanges();
  }

  function givenSelectorVisibleConMinimo(minimo: string): void {
    component.mostrarSelectorFechaRetiro = true;
    component.fechaRetiroMinima = minimo;
    fixture.detectChanges();
  }

  function givenSelectorVisibleYDeshabilitado(): void {
    component.mostrarSelectorFechaRetiro = true;
    component.deshabilitado = true;
    fixture.detectChanges();
  }

  function givenOpciones(opciones: SugerenciaCapacidad[]): void {
    component.opciones = opciones;
  }

  function givenDeshabilitado(): void {
    component.deshabilitado = true;
  }

  function whenCambioLaFechaEnElSelector(valor: string): void {
    const input = buscarInputFecha();
    input.value = valor;
    input.dispatchEvent(new Event('change'));
  }

  function whenLlamoProtegido(
    metodo: 'onCerrar' | 'onEscape' | 'onNuevaConversacion' | 'onVerHistorial' | 'onToggleAcciones',
  ): void {
    protegido()[metodo]();
  }

  function whenLlamoOnEnviar(texto: string): void {
    protegido().onEnviar(texto);
  }

  function whenLlamoOnSugerencia(prompt: string): void {
    protegido().onSugerencia(prompt);
  }

  function whenLlamoOnOpcion(opcion: SugerenciaCapacidad): void {
    protegido().onOpcion(opcion);
  }

  function thenSeEmitioFechaRetiro(fecha: string): void {
    expect(component.fechaRetiro.emit).toHaveBeenCalledOnceWith(fecha);
  }

  function thenNoSeEmitioFechaRetiro(): void {
    expect(component.fechaRetiro.emit).not.toHaveBeenCalled();
  }

  function buscarInputFecha(): HTMLInputElement {
    const input = fixture.nativeElement.querySelector(
      '#asistente-fecha-retiro',
    ) as HTMLInputElement | null;
    expect(input).withContext('deberia renderizar el selector').not.toBeNull();
    return input as HTMLInputElement;
  }
});
