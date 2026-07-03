import { Component, Input, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Perfil } from '../../../../data-access/models/perfil.model';
import { PerfilMother } from '../../../../data-access/services/alumno.mother';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { PerfilUsuarioService } from '../../../../data-access/services/perfil-usuario.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CropModalComponent } from '../../../perfil-usuario/components/crop-modal/crop-modal.component';
import { TutorHeaderComponent } from './tutor-header.component';

@Component({ selector: 'app-crop-modal', template: '', standalone: true })
class CropModalStub {
  @Input() open = false;
}

describe('TutorHeaderComponent', () => {
  let component: TutorHeaderComponent;
  let fixture: ComponentFixture<TutorHeaderComponent>;
  let servicioPerfilUsuario: jasmine.SpyObj<PerfilUsuarioService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let perfilSignal: WritableSignal<Perfil | null>;

  beforeEach(async () => {
    servicioPerfilUsuario = jasmine.createSpyObj('PerfilUsuarioService', ['subirFotoPerfil']);
    servicioPerfilUsuario.subirFotoPerfil.and.resolveTo();
    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    perfilSignal = signal<Perfil | null>(PerfilMother.crearTutor());

    await TestBed.configureTestingModule({
      imports: [TutorHeaderComponent],
      providers: [
        { provide: PerfilUsuarioService, useValue: servicioPerfilUsuario },
        { provide: ToastService, useValue: servicioToast },
        { provide: PerfilService, useValue: { perfil: perfilSignal.asReadonly() } },
      ],
    })
      .overrideComponent(TutorHeaderComponent, {
        remove: { imports: [CropModalComponent] },
        add: { imports: [CropModalStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TutorHeaderComponent);
    component = fixture.componentInstance;
    component.iniciales = 'MP';
    component.nombreCompleto = 'Martin';
    component.cantidadHijos = 1;
    component.cantidadColegios = 1;
    component.saldoTotalFormateado = '$5.000';
  });

  describe('resumenHijos', () => {
    it('dado 1 hijo y 1 colegio, deberia decir "1 hijo" sin mencionar colegios', () => {
      expect(component.resumenHijos).toBe('1 hijo');
    });

    it('dado 3 hijos y 1 colegio, deberia decir "3 hijos" sin mencionar colegios', () => {
      component.cantidadHijos = 3;
      component.cantidadColegios = 1;

      expect(component.resumenHijos).toBe('3 hijos');
    });

    it('dado 2 hijos en 2 colegios distintos, deberia mostrar "hijos" y "colegios"', () => {
      component.cantidadHijos = 2;
      component.cantidadColegios = 2;

      expect(component.resumenHijos).toContain('2 hijos');
      expect(component.resumenHijos).toContain('2 colegios');
    });
  });

  describe('render', () => {
    it('dado iniciales y nombreCompleto, cuando renderizo, deberia mostrarlos', () => {
      whenMonto();

      const texto = textoRenderizado();
      expect(texto).toContain('MP');
      expect(texto).toContain('Martin');
      expect(texto).toContain('$5.000');
    });
  });

  describe('validaciones de foto', () => {
    it('dado un archivo PDF, cuando lo selecciono, deberia mostrar toast de tipo no permitido', async () => {
      const input = crearInputConArchivo(new File([''], 'doc.pdf', { type: 'application/pdf' }));

      await (component as unknown as { onFotoSeleccionada(e: Event): Promise<void> }).onFotoSeleccionada({
        target: input,
      } as unknown as Event);

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Solo se permiten imágenes JPG, PNG o WEBP.',
        'error',
      );
    });

    it('dado un archivo > 5MB, cuando lo selecciono, deberia mostrar toast de tamano', async () => {
      const grande = new File([new Uint8Array(6 * 1024 * 1024)], 'foto.jpg', {
        type: 'image/jpeg',
      });
      const input = crearInputConArchivo(grande);

      await (component as unknown as { onFotoSeleccionada(e: Event): Promise<void> }).onFotoSeleccionada({
        target: input,
      } as unknown as Event);

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'La imagen no puede superar los 5 MB.',
        'error',
      );
    });

    it('dado un archivo valido, cuando lo selecciono, no deberia mostrar toast de error', async () => {
      const valido = new File([''], 'foto.jpg', { type: 'image/jpeg' });
      const input = crearInputConArchivo(valido);

      await (component as unknown as { onFotoSeleccionada(e: Event): Promise<void> }).onFotoSeleccionada({
        target: input,
      } as unknown as Event);

      expect(servicioToast.mostrar).not.toHaveBeenCalled();
    });
  });

  describe('esPremium', () => {
    it('dado plan PREMIUM, esPremium deberia ser true', () => {
      const premium = { ...PerfilMother.crearTutor(), plan: 'PREMIUM' } as Perfil;
      perfilSignal.set(premium);

      expect((component as unknown as { esPremium(): boolean }).esPremium()).toBeTrue();
    });

    it('dado plan AVANZADO, esPremium deberia ser true', () => {
      const avanzado = { ...PerfilMother.crearTutor(), plan: 'AVANZADO' } as Perfil;
      perfilSignal.set(avanzado);

      expect((component as unknown as { esPremium(): boolean }).esPremium()).toBeTrue();
    });

    it('dado plan GRATIS, esPremium deberia ser false', () => {
      const gratis = { ...PerfilMother.crearTutor(), plan: 'GRATIS' } as Perfil;
      perfilSignal.set(gratis);

      expect((component as unknown as { esPremium(): boolean }).esPremium()).toBeFalse();
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function crearInputConArchivo(archivo: File): HTMLInputElement {
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [archivo], writable: false });
    return input;
  }
});
