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
    it('emite la fecha seleccionada cuando no es anterior al minimo', () => {
      spyOn(component.fechaRetiro, 'emit');
      component.mostrarSelectorFechaRetiro = true;
      component.fechaRetiroMinima = '2026-07-03';
      fixture.detectChanges();

      const input = buscarInputFecha();
      input.value = '2026-07-03';
      input.dispatchEvent(new Event('change'));

      expect(component.fechaRetiro.emit).toHaveBeenCalledOnceWith('2026-07-03');
    });

    it('no emite fechas anteriores al minimo', () => {
      spyOn(component.fechaRetiro, 'emit');
      component.mostrarSelectorFechaRetiro = true;
      component.fechaRetiroMinima = '2026-07-03';
      fixture.detectChanges();

      const input = buscarInputFecha();
      input.value = '2026-07-02';
      input.dispatchEvent(new Event('change'));

      expect(component.fechaRetiro.emit).not.toHaveBeenCalled();
    });

    it('no emite cuando esta deshabilitado', () => {
      spyOn(component.fechaRetiro, 'emit');
      component.mostrarSelectorFechaRetiro = true;
      component.deshabilitado = true;
      fixture.detectChanges();

      const input = buscarInputFecha();
      input.value = '2026-07-10';
      input.dispatchEvent(new Event('change'));

      expect(component.fechaRetiro.emit).not.toHaveBeenCalled();
    });

    it('no emite cuando el valor viene vacio', () => {
      spyOn(component.fechaRetiro, 'emit');
      component.mostrarSelectorFechaRetiro = true;
      fixture.detectChanges();

      const input = buscarInputFecha();
      input.value = '';
      input.dispatchEvent(new Event('change'));

      expect(component.fechaRetiro.emit).not.toHaveBeenCalled();
    });
  });

  describe('emisiones simples', () => {
    it('onCerrar y onEscape deberian emitir el evento cerrar', () => {
      spyOn(component.cerrar, 'emit');

      (component as unknown as ProtegidoAsistente).onCerrar();
      (component as unknown as ProtegidoAsistente).onEscape();

      expect(component.cerrar.emit).toHaveBeenCalledTimes(2);
    });

    it('onEnviar deberia reemitir el texto al output enviar', () => {
      spyOn(component.enviar, 'emit');

      (component as unknown as ProtegidoAsistente).onEnviar('hola');

      expect(component.enviar.emit).toHaveBeenCalledWith('hola');
    });

    it('onSugerencia deberia reemitir el prompt al output sugerencia', () => {
      spyOn(component.sugerencia, 'emit');

      (component as unknown as ProtegidoAsistente).onSugerencia('saldo');

      expect(component.sugerencia.emit).toHaveBeenCalledWith('saldo');
    });

    it('onNuevaConversacion y onVerHistorial deberian emitir sus outputs', () => {
      spyOn(component.nuevaConversacion, 'emit');
      spyOn(component.verHistorial, 'emit');

      (component as unknown as ProtegidoAsistente).onNuevaConversacion();
      (component as unknown as ProtegidoAsistente).onVerHistorial();

      expect(component.nuevaConversacion.emit).toHaveBeenCalled();
      expect(component.verHistorial.emit).toHaveBeenCalled();
    });
  });

  describe('acciones y opciones', () => {
    it('dado opciones vacias, onToggleAcciones deberia no cambiar el estado', () => {
      component.opciones = [];

      const antes = (component as unknown as ProtegidoAsistente).accionesAbiertas_();
      (component as unknown as ProtegidoAsistente).onToggleAcciones();

      expect((component as unknown as ProtegidoAsistente).accionesAbiertas_()).toBe(antes);
    });

    it('dado opciones no vacias, onToggleAcciones deberia flipear la flag', () => {
      component.opciones = [SugerenciaCapacidadMother.crear()];

      (component as unknown as ProtegidoAsistente).onToggleAcciones();
      expect((component as unknown as ProtegidoAsistente).accionesAbiertas_()).toBeFalse();

      (component as unknown as ProtegidoAsistente).onToggleAcciones();
      expect((component as unknown as ProtegidoAsistente).accionesAbiertas_()).toBeTrue();
    });

    it('dado deshabilitado true, onOpcion no deberia emitir sugerencia', () => {
      spyOn(component.sugerencia, 'emit');
      component.deshabilitado = true;

      (component as unknown as ProtegidoAsistente).onOpcion(SugerenciaCapacidadMother.crear());

      expect(component.sugerencia.emit).not.toHaveBeenCalled();
    });

    it('dado deshabilitado false, onOpcion deberia cerrar acciones y emitir el prompt', () => {
      spyOn(component.sugerencia, 'emit');
      component.opciones = [SugerenciaCapacidadMother.crear()];

      (component as unknown as ProtegidoAsistente).onOpcion(SugerenciaCapacidadMother.crear({ prompt: 'ir' }));

      expect((component as unknown as ProtegidoAsistente).accionesAbiertas_()).toBeFalse();
      expect(component.sugerencia.emit).toHaveBeenCalledWith('ir');
    });
  });

  describe('trackers', () => {
    it('trackById deberia devolver el id del mensaje', () => {
      const mensaje = { id: 'mensaje-1' } as MensajeAsistente;

      expect((component as unknown as ProtegidoAsistente).trackById(0, mensaje)).toBe('mensaje-1');
    });

    it('trackByGrupo y trackByOpcion deberian devolver el id respectivo', () => {
      expect((component as unknown as ProtegidoAsistente).trackByGrupo(0, { id: 'cuenta' })).toBe('cuenta');
      expect((component as unknown as ProtegidoAsistente).trackByOpcion(0, SugerenciaCapacidadMother.crear({ id: 'op-x' }))).toBe('op-x');
    });
  });

  describe('crearGruposOpciones', () => {
    it('dado opciones de distintas capacidades, deberia agruparlas por grupo en el orden esperado', () => {
      component.opciones = [
        SugerenciaCapacidadMother.crear({ id: 'saldo', capacidad: 'SALDO' }),
        SugerenciaCapacidadMother.crear({ id: 'compras', capacidad: 'COMPRAS' }),
        SugerenciaCapacidadMother.crear({ id: 'stock', capacidad: 'STOCK' }),
        SugerenciaCapacidadMother.crear({ id: 'raro', capacidad: undefined }),
      ];

      const grupos = (component as unknown as ProtegidoAsistente).gruposOpciones();

      expect(grupos.map((g) => g.id)).toEqual(['cuenta', 'compras', 'buffet', 'general']);
      expect(grupos.find((g) => g.id === 'general')?.opciones.map((o) => o.id)).toEqual(['raro']);
    });

    it('dado que no hay opciones para ciertos grupos, esos grupos deberian omitirse', () => {
      component.opciones = [SugerenciaCapacidadMother.crear({ capacidad: 'SALDO' })];

      const grupos = (component as unknown as ProtegidoAsistente).gruposOpciones();

      expect(grupos.map((g) => g.id)).toEqual(['cuenta']);
    });
  });

  function buscarInputFecha(): HTMLInputElement {
    const input = fixture.nativeElement.querySelector(
      '#asistente-fecha-retiro',
    ) as HTMLInputElement | null;
    expect(input).withContext('deberia renderizar el selector').not.toBeNull();
    return input as HTMLInputElement;
  }
});
