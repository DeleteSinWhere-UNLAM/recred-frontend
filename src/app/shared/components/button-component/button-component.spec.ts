import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ButtonComponent } from './button-component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado el componente, cuando se monta, deberia crearse con defaults primary y no deshabilitado', () => {
    expect(component).toBeTruthy();
    expect(component.variant).toBe('primary');
    expect(component.disabled).toBeFalse();
  });

  describe('getClasses', () => {
    it('dado disabled true, cuando pido las clases, deberia devolver las de disabled sin importar la variant', () => {
      givenBotonCon('success', true);

      const clases = whenPidoLasClases();

      thenLasClasesIncluyen(clases, 'opacity-50');
      thenLasClasesIncluyen(clases, 'cursor-not-allowed');
      thenLasClasesNoIncluyen(clases, 'bg-menta');
    });

    it('dado variant primary, cuando pido las clases, deberia incluir bg-pizarra', () => {
      givenBotonCon('primary', false);

      thenLasClasesIncluyen(whenPidoLasClases(), 'bg-pizarra text-white');
    });

    it('dado variant success, cuando pido las clases, deberia incluir bg-menta', () => {
      givenBotonCon('success', false);

      thenLasClasesIncluyen(whenPidoLasClases(), 'bg-menta');
    });

    it('dado variant danger, cuando pido las clases, deberia incluir bg-melocoton', () => {
      givenBotonCon('danger', false);

      thenLasClasesIncluyen(whenPidoLasClases(), 'bg-melocoton');
    });

    it('dado variant outline, cuando pido las clases, deberia incluir border-2 border-pizarra', () => {
      givenBotonCon('outline', false);

      const clases = whenPidoLasClases();
      thenLasClasesIncluyen(clases, 'border-2');
      thenLasClasesIncluyen(clases, 'border-pizarra');
    });

    it('dado una variant desconocida, cuando pido las clases, deberia devolver solo las clases base', () => {
      component.variant = 'inexistente' as unknown as ButtonComponent['variant'];

      expect(whenPidoLasClases()).toBe('px-4 py-2 rounded-lg font-semibold transition-all duration-200 ');
    });

    it('dado todas las variantes habilitadas, cuando pido las clases, deberian incluir la clase base', () => {
      const variants: ButtonComponent['variant'][] = ['primary', 'success', 'danger', 'outline'];

      for (const variant of variants) {
        givenBotonCon(variant, false);
        thenLasClasesIncluyen(whenPidoLasClases(), 'rounded-lg');
      }
    });
  });

  describe('interaccion del boton', () => {
    it('cuando hago click en el boton, deberia emitir Click', () => {
      const spyEmit = spyOn(component.Click, 'emit');

      whenHagoClickEnElBoton();

      expect(spyEmit).toHaveBeenCalled();
    });

    it('dado disabled true, cuando se renderiza, el boton nativo deberia quedar deshabilitado', () => {
      givenBotonCon('primary', true);
      fixture.detectChanges();

      thenElBotonNativoEstaDeshabilitado(true);
    });

    it('dado disabled false, cuando se renderiza, el boton deberia quedar habilitado', () => {
      givenBotonCon('primary', false);
      fixture.detectChanges();

      thenElBotonNativoEstaDeshabilitado(false);
    });
  });

  function givenBotonCon(variant: ButtonComponent['variant'], disabled: boolean): void {
    component.variant = variant;
    component.disabled = disabled;
  }

  function whenPidoLasClases(): string {
    return component.getClasses();
  }

  function whenHagoClickEnElBoton(): void {
    fixture.debugElement.query(By.css('button')).triggerEventHandler('click', null);
  }

  function thenLasClasesIncluyen(clases: string, fragmento: string): void {
    expect(clases).toContain(fragmento);
  }

  function thenLasClasesNoIncluyen(clases: string, fragmento: string): void {
    expect(clases).not.toContain(fragmento);
  }

  function thenElBotonNativoEstaDeshabilitado(esperado: boolean): void {
    const boton = fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;
    expect(boton.disabled).toBe(esperado);
  }
});
