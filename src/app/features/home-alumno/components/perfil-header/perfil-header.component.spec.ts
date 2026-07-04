import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FondoPerfil } from '../../models/fondo-perfil.model';
import { PerfilHeaderComponent } from './perfil-header.component';

describe('PerfilHeaderComponent', () => {
  let component: PerfilHeaderComponent;
  let fixture: ComponentFixture<PerfilHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilHeaderComponent);
    component = fixture.componentInstance;
    component.iniciales = 'JG';
    component.nombreCompleto = 'Julián García';
    component.grado = '4to A';
    component.colegio = 'San José';
    component.saldoFormateado = '$ 2.000';
    fixture.detectChanges();
  });

  describe('render', () => {
    it('dado los datos del alumno, deberia mostrar nombre, grado, colegio y saldo', () => {
      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('Julián García');
      expect(texto).toContain('4to A');
      expect(texto).toContain('San José');
      expect(texto).toContain('$ 2.000');
    });

    it('dado sin urlFotoPerfil, deberia mostrar las iniciales', () => {
      const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(texto).toContain('JG');
    });

    it('dado una urlFotoPerfil, deberia renderizar la imagen del avatar', () => {
      fixture.componentRef.setInput('urlFotoPerfil', 'https://cdn/foto.webp');
      fixture.detectChanges();

      const img = (fixture.nativeElement as HTMLElement).querySelector(
        '.perfil-header__avatar-img',
      );
      expect(img?.getAttribute('src')).toBe('https://cdn/foto.webp');
    });

    it('dado saldoNegativo, deberia agregar la clase perfil-header__saldo--negativo', () => {
      fixture.componentRef.setInput('saldoNegativo', true);
      fixture.detectChanges();

      const saldo = (fixture.nativeElement as HTMLElement).querySelector('.perfil-header__saldo');
      expect(saldo?.classList.contains('perfil-header__saldo--negativo')).toBeTrue();
    });

    it('dado fondo minecraft, deberia aplicar la clase perfil-header--fondo-minecraft', () => {
      fixture.componentRef.setInput('fondo', 'minecraft');
      fixture.detectChanges();

      const section = (fixture.nativeElement as HTMLElement).querySelector('.perfil-header');
      expect(section?.classList.contains('perfil-header--fondo-minecraft')).toBeTrue();
    });
  });

  describe('menu de fondos', () => {
    it('dado el menu cerrado, cuando hago click en editar, deberia abrirlo', () => {
      expect(component.menuAbierto()).toBeFalse();

      whenHagoClickEnEditar();

      expect(component.menuAbierto()).toBeTrue();
    });

    it('dado el menu abierto, cuando hago click de nuevo en editar, deberia cerrarlo', () => {
      whenHagoClickEnEditar();
      whenHagoClickEnEditar();

      expect(component.menuAbierto()).toBeFalse();
    });

    it('dado el menu abierto, deberia renderizar las 5 opciones de fondo', () => {
      whenHagoClickEnEditar();
      fixture.detectChanges();

      const opciones = (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.perfil-header__opcion',
      );
      expect(opciones.length).toBe(5);
    });

    it('dado el menu abierto, cuando elijo un fondo, deberia emitir cambioFondo y cerrar el menu', () => {
      const spy = jasmine.createSpy('cambioFondo');
      component.cambioFondo.subscribe(spy);
      const fondoElegido: FondoPerfil = 'messi';

      component.elegirFondo(fondoElegido);

      expect(spy).toHaveBeenCalledWith('messi');
      expect(component.menuAbierto()).toBeFalse();
    });
  });

  function whenHagoClickEnEditar(): void {
    const boton = (fixture.nativeElement as HTMLElement).querySelector(
      '.perfil-header__editar',
    ) as HTMLButtonElement;
    boton.click();
    fixture.detectChanges();
  }
});
