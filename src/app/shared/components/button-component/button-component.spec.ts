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
    it('dado disabled true, deberia devolver clases de disabled sin importar la variant', () => {
      component.disabled = true;
      component.variant = 'success';

      const clases = component.getClasses();

      expect(clases).toContain('opacity-50');
      expect(clases).toContain('cursor-not-allowed');
      expect(clases).not.toContain('bg-menta');
    });

    it('dado variant primary, deberia incluir bg-pizarra', () => {
      component.variant = 'primary';

      expect(component.getClasses()).toContain('bg-pizarra text-white');
    });

    it('dado variant success, deberia incluir bg-menta', () => {
      component.variant = 'success';

      expect(component.getClasses()).toContain('bg-menta');
    });

    it('dado variant danger, deberia incluir bg-melocoton', () => {
      component.variant = 'danger';

      expect(component.getClasses()).toContain('bg-melocoton');
    });

    it('dado variant outline, deberia incluir border-2 border-pizarra', () => {
      component.variant = 'outline';

      const clases = component.getClasses();
      expect(clases).toContain('border-2');
      expect(clases).toContain('border-pizarra');
    });

    it('dado una variant desconocida, deberia devolver solo las clases base', () => {
      component.variant = 'inexistente' as unknown as ButtonComponent['variant'];

      const clases = component.getClasses();
      expect(clases).toBe('px-4 py-2 rounded-lg font-semibold transition-all duration-200 ');
    });

    it('dado la clase base, todas las variantes habilitadas deberian incluirla', () => {
      const variants: ButtonComponent['variant'][] = ['primary', 'success', 'danger', 'outline'];

      for (const variant of variants) {
        component.variant = variant;
        expect(component.getClasses()).toContain('rounded-lg');
      }
    });
  });

  describe('interaccion del boton', () => {
    it('cuando hago click en el boton, deberia emitir Click', () => {
      const spyEmit = spyOn(component.Click, 'emit');

      fixture.debugElement.query(By.css('button')).triggerEventHandler('click', null);

      expect(spyEmit).toHaveBeenCalled();
    });

    it('dado disabled true, el boton nativo deberia quedar deshabilitado', () => {
      component.disabled = true;
      fixture.detectChanges();

      const boton = fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;
      expect(boton.disabled).toBeTrue();
    });

    it('dado disabled false, el boton deberia quedar habilitado', () => {
      component.disabled = false;
      fixture.detectChanges();

      const boton = fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;
      expect(boton.disabled).toBeFalse();
    });
  });
});
