import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsistenteFabComponent } from './asistente-fab.component';

describe('AsistenteFabComponent', () => {
  let component: AsistenteFabComponent;
  let fixture: ComponentFixture<AsistenteFabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsistenteFabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AsistenteFabComponent);
    component = fixture.componentInstance;
  });

  describe('render', () => {
    it('dado por defecto, cuando renderizo, deberia mostrar el badge "¡Hola!"', () => {
      whenMonto();

      const badge = boton().querySelector('.asistente-fab__badge');
      expect(badge?.textContent).toContain('¡Hola!');
    });

    it('dado oculto=true, cuando renderizo, deberia agregar la clase asistente-fab--oculto y ocultar el badge', () => {
      component.oculto = true;

      whenMonto();

      expect(boton().classList.contains('asistente-fab--oculto')).toBeTrue();
      expect(boton().querySelector('.asistente-fab__badge')).toBeNull();
    });

    it('dado mostrarBadge=false, cuando renderizo, no deberia mostrar el badge aunque este visible', () => {
      component.mostrarBadge = false;

      whenMonto();

      expect(boton().querySelector('.asistente-fab__badge')).toBeNull();
    });

    it('dado bloqueado=true, cuando renderizo, deberia mostrar el candado', () => {
      component.bloqueado = true;

      whenMonto();

      expect(boton().classList.contains('asistente-fab--locked')).toBeTrue();
      expect(boton().querySelector('.asistente-fab__lock')).not.toBeNull();
    });
  });

  describe('togglePanel', () => {
    it('cuando hago click en el FAB, deberia emitir togglePanel', () => {
      spyOn(component.togglePanel, 'emit');
      whenMonto();

      boton().click();

      expect(component.togglePanel.emit).toHaveBeenCalled();
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function boton(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector('button.asistente-fab')!;
  }
});
