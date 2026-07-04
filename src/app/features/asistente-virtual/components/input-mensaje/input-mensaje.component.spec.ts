import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputMensajeComponent } from './input-mensaje.component';

describe('InputMensajeComponent', () => {
  let component: InputMensajeComponent;
  let fixture: ComponentFixture<InputMensajeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputMensajeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputMensajeComponent);
    component = fixture.componentInstance;
  });

  describe('render de las acciones', () => {
    it('dado mostrarAcciones=false, cuando renderizo, no deberia mostrar el boton de acciones', () => {
      whenMonto();

      expect(botonAcciones()).toBeNull();
    });

    it('dado mostrarAcciones=true, cuando renderizo, deberia mostrar el boton de acciones', () => {
      component.mostrarAcciones = true;

      whenMonto();

      expect(botonAcciones()).not.toBeNull();
    });

    it('dado accionesAbiertas=true, cuando renderizo, deberia marcar aria-expanded en true', () => {
      component.mostrarAcciones = true;
      component.accionesAbiertas = true;

      whenMonto();

      expect(botonAcciones()?.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('submit', () => {
    it('dado texto vacio, cuando hago submit, no deberia emitir enviar', () => {
      spyOn(component.enviar, 'emit');
      whenMonto();

      form().dispatchEvent(new Event('submit'));

      expect(component.enviar.emit).not.toHaveBeenCalled();
    });

    it('dado texto con espacios al final, cuando hago submit, deberia emitir enviar con el texto trimeado y limpiar el signal', () => {
      spyOn(component.enviar, 'emit');
      whenMonto();
      component['texto'].set('  hola  ');

      form().dispatchEvent(new Event('submit'));

      expect(component.enviar.emit).toHaveBeenCalledWith('hola');
      expect(component['texto']()).toBe('');
    });

    it('dado deshabilitado=true y texto valido, cuando hago submit, no deberia emitir enviar', () => {
      spyOn(component.enviar, 'emit');
      component.deshabilitado = true;
      whenMonto();
      component['texto'].set('hola');

      form().dispatchEvent(new Event('submit'));

      expect(component.enviar.emit).not.toHaveBeenCalled();
    });
  });

  describe('alternarAcciones', () => {
    it('cuando hago click en el boton de acciones, deberia emitir alternarAcciones', () => {
      spyOn(component.alternarAcciones, 'emit');
      component.mostrarAcciones = true;
      whenMonto();

      botonAcciones()?.click();

      expect(component.alternarAcciones.emit).toHaveBeenCalled();
    });
  });

  describe('enfocar', () => {
    it('cuando llamo a enfocar, deberia poner el foco en el input tras la microtask', async () => {
      whenMonto();
      const input = campoInput();

      component.enfocar();
      await Promise.resolve();

      expect(document.activeElement).toBe(input);
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function form(): HTMLFormElement {
    return (fixture.nativeElement as HTMLElement).querySelector('form.input-mensaje')!;
  }

  function botonAcciones(): HTMLButtonElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('.input-mensaje__acciones');
  }

  function campoInput(): HTMLInputElement {
    return (fixture.nativeElement as HTMLElement).querySelector('input.input-mensaje__campo')!;
  }
});
