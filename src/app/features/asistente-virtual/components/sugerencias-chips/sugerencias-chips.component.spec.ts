import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SugerenciaCapacidad } from '../../models/capacidad-asistente.model';
import { SugerenciasChipsComponent } from './sugerencias-chips.component';

class SugerenciaCapacidadMother {
  static crear(override: Partial<SugerenciaCapacidad> = {}): SugerenciaCapacidad {
    return {
      id: 'sug-1',
      label: 'Saldo',
      emoji: '$',
      prompt: 'saldo',
      ...override,
    };
  }

  static crearConfirmacion(): SugerenciaCapacidad {
    return SugerenciaCapacidadMother.crear({
      id: 'confirmar',
      label: 'Confirmar',
      prompt: 'confirmar',
      tipo: 'confirmacion',
    });
  }

  static crearCancelacion(): SugerenciaCapacidad {
    return SugerenciaCapacidadMother.crear({
      id: 'cancelar',
      label: 'Cancelar',
      prompt: 'cancelar',
      tipo: 'cancelacion',
    });
  }

  static crearBackend(): SugerenciaCapacidad {
    return SugerenciaCapacidadMother.crear({
      id: 'next',
      label: 'Siguiente paso',
      prompt: 'seguir',
      tipo: 'backend',
    });
  }
}

describe('SugerenciasChipsComponent', () => {
  let component: SugerenciasChipsComponent;
  let fixture: ComponentFixture<SugerenciasChipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SugerenciasChipsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SugerenciasChipsComponent);
    component = fixture.componentInstance;
  });

  describe('render', () => {
    it('dado sin sugerencias, cuando renderizo, no deberia mostrar el contenedor', () => {
      component.sugerencias = [];

      whenMonto();

      expect(contenedor()).toBeNull();
    });

    it('dadas sugerencias, cuando renderizo, deberia crear un chip por sugerencia con su label', () => {
      component.sugerencias = [
        SugerenciaCapacidadMother.crear({ label: 'Saldo' }),
        SugerenciaCapacidadMother.crear({ id: 'sug-2', label: 'Compras' }),
      ];

      whenMonto();

      const chips = chipsBotones();
      expect(chips.length).toBe(2);
      expect(chips[0].textContent).toContain('Saldo');
      expect(chips[1].textContent).toContain('Compras');
    });

    it('dado una sugerencia premium, cuando renderizo, deberia marcarla con la clase premium', () => {
      component.sugerencias = [SugerenciaCapacidadMother.crear({ premium: true })];

      whenMonto();

      expect(chipsBotones()[0].classList.contains('sugerencias-chips__chip--premium')).toBeTrue();
    });

    it('dado una sugerencia bloqueada, cuando renderizo, deberia marcarla con candado y deshabilitarla', () => {
      component.sugerencias = [SugerenciaCapacidadMother.crear({ bloqueada: true })];

      whenMonto();

      expect(chipsBotones()[0].classList.contains('sugerencias-chips__chip--locked')).toBeTrue();
      expect(chipsBotones()[0].disabled).toBeTrue();
      expect(chipsBotones()[0].querySelector('.fa-lock')).not.toBeNull();
    });
  });

  describe('hint segun tipo de sugerencia', () => {
    it('dada una sugerencia de tipo confirmacion, hint deberia ser "Compra pendiente"', () => {
      component.sugerencias = [SugerenciaCapacidadMother.crearConfirmacion()];

      whenMonto();

      expect(textoHint()).toBe('Compra pendiente');
    });

    it('dada una sugerencia de tipo cancelacion, hint deberia ser "Compra pendiente"', () => {
      component.sugerencias = [SugerenciaCapacidadMother.crearCancelacion()];

      whenMonto();

      expect(textoHint()).toBe('Compra pendiente');
    });

    it('dada una sugerencia de tipo backend, hint deberia ser "Siguiente paso"', () => {
      component.sugerencias = [SugerenciaCapacidadMother.crearBackend()];

      whenMonto();

      expect(textoHint()).toBe('Siguiente paso');
    });

    it('dada una sugerencia sin tipo, hint deberia ser "Opciones rapidas"', () => {
      component.sugerencias = [SugerenciaCapacidadMother.crear()];

      whenMonto();

      expect(textoHint()).toBe('Opciones rapidas');
    });
  });

  describe('click en chip', () => {
    it('cuando hago click en un chip, deberia emitir elegir con el prompt de la sugerencia', () => {
      const sugerencia = SugerenciaCapacidadMother.crear({ prompt: 'mostrame el saldo' });
      component.sugerencias = [sugerencia];
      spyOn(component.elegir, 'emit');
      whenMonto();

      chipsBotones()[0].click();

      expect(component.elegir.emit).toHaveBeenCalledWith('mostrame el saldo');
    });

    it('dado deshabilitado=true, cuando hago click en un chip, no deberia emitir elegir', () => {
      component.sugerencias = [SugerenciaCapacidadMother.crear()];
      component.deshabilitado = true;
      spyOn(component.elegir, 'emit');
      whenMonto();

      component['onClick'](component.sugerencias[0]);

      expect(component.elegir.emit).not.toHaveBeenCalled();
    });

    it('dado una sugerencia bloqueada, cuando hago click en un chip, no deberia emitir elegir', () => {
      component.sugerencias = [SugerenciaCapacidadMother.crear({ bloqueada: true })];
      spyOn(component.elegir, 'emit');
      whenMonto();

      component['onClick'](component.sugerencias[0]);

      expect(component.elegir.emit).not.toHaveBeenCalled();
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function contenedor(): HTMLElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('.sugerencias-chips');
  }

  function chipsBotones(): HTMLButtonElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        '.sugerencias-chips__chip',
      ),
    );
  }

  function textoHint(): string {
    return (fixture.nativeElement as HTMLElement).querySelector('.sugerencias-chips__hint')
      ?.textContent
      ?.trim() ?? '';
  }
});
