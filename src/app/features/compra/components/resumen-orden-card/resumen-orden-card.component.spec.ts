import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import {
  ResumenLinea,
  ResumenOrdenCardComponent,
} from './resumen-orden-card.component';

interface Perfil {
  id: string;
  nombre: string;
  plan?: string;
}

describe('ResumenOrdenCardComponent', () => {
  let component: ResumenOrdenCardComponent;
  let fixture: ComponentFixture<ResumenOrdenCardComponent>;
  let perfilSignal: ReturnType<typeof signal<Perfil | null>>;

  beforeEach(async () => {
    perfilSignal = signal<Perfil | null>({ id: 'p-1', nombre: 'Tutor', plan: 'GRATUITO' });

    await TestBed.configureTestingModule({
      imports: [ResumenOrdenCardComponent],
      providers: [
        { provide: PerfilService, useValue: { perfil: perfilSignal } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumenOrdenCardComponent);
    component = fixture.componentInstance;
  });

  describe('render', () => {
    it('dado sin lineas, cuando renderizo, deberia mostrar "El carrito está vacío."', () => {
      component.lineas = [];
      component.total = 0;

      whenMonto();

      expect(textoRenderizado()).toContain('El carrito está vacío.');
    });

    it('dadas dos lineas, cuando renderizo, deberia mostrar cada nombre + subtotal y el total formateado', () => {
      component.lineas = [
        { alumnoId: 'a-1', nombre: 'Juan', subtotal: 500, incluido: true },
        { alumnoId: 'a-2', nombre: 'Ana', subtotal: 1000, incluido: true },
      ] as ResumenLinea[];
      component.total = 1500;

      whenMonto();

      const html = textoRenderizado();
      expect(html).toContain('Juan');
      expect(html).toContain('Ana');
      expect(html).toMatch(/\$\s?500/);
      expect(html).toMatch(/\$\s?1\.000/);
      expect(html).toMatch(/\$\s?1\.500/);
    });

    it('dada una linea excluida, cuando renderizo, deberia marcarla con la clase --excluida', () => {
      component.lineas = [{ alumnoId: 'a-1', nombre: 'Juan', subtotal: 500, incluido: false }];
      component.total = 0;

      whenMonto();

      const li = (fixture.nativeElement as HTMLElement).querySelector('.resumen__linea');
      expect(li?.classList.contains('resumen__linea--excluida')).toBeTrue();
    });

    it('dada una advertencia, cuando renderizo, deberia mostrarla', () => {
      component.lineas = [];
      component.advertencia = 'Saldo insuficiente';

      whenMonto();

      expect(textoRenderizado()).toContain('Saldo insuficiente');
    });
  });

  describe('CTA', () => {
    it('dado ctaLabel personalizado, cuando renderizo, deberia mostrarlo en el boton', () => {
      component.lineas = [];
      fixture.componentRef.setInput('ctaLabel', 'Confirmar Pago');

      whenMonto();

      expect(botonCTA().textContent).toContain('Confirmar Pago');
    });

    it('dado cargando=true, cuando renderizo, deberia deshabilitar el boton y mostrar "Procesando..."', () => {
      component.lineas = [];
      fixture.componentRef.setInput('cargando', true);

      whenMonto();

      expect(botonCTA().disabled).toBeTrue();
      expect(botonCTA().textContent).toContain('Procesando...');
    });

    it('dado ctaDeshabilitado=true, cuando renderizo, deberia deshabilitar el boton', () => {
      component.lineas = [];
      fixture.componentRef.setInput('ctaDeshabilitado', true);

      whenMonto();

      expect(botonCTA().disabled).toBeTrue();
    });

    it('cuando hago click en el CTA, deberia emitir accion', () => {
      component.lineas = [];
      whenMonto();
      spyOn(component.accion, 'emit');

      botonCTA().click();

      expect(component.accion.emit).toHaveBeenCalled();
    });
  });

  describe('esPremium', () => {
    it('dado plan PREMIUM, esPremium deberia ser true y el CTA tiene la clase --premium', () => {
      perfilSignal.set({ id: 'p-1', nombre: 'Tutor', plan: 'PREMIUM' });
      component.lineas = [];

      whenMonto();

      expect(component.esPremium()).toBeTrue();
      expect(botonCTA().classList.contains('resumen__cta--premium')).toBeTrue();
    });

    it('dado plan GRATUITO, esPremium deberia ser false', () => {
      component.lineas = [];

      whenMonto();

      expect(component.esPremium()).toBeFalse();
    });
  });

  describe('get total', () => {
    it('dado un total seteado, el getter total deberia devolverlo', () => {
      component.total = 1234;

      expect(component.total).toBe(1234);
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function botonCTA(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.resumen__cta')!;
  }
});
