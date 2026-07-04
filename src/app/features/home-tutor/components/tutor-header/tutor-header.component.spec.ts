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

    it('dado que no hay perfil cargado, esPremium deberia ser false', () => {
      perfilSignal.set(null);

      expect((component as unknown as { esPremium(): boolean }).esPremium()).toBeFalse();
    });
  });

  describe('abrirSelectorFoto', () => {
    it('cuando hago click en el avatar, deberia disparar el click del input oculto', () => {
      whenMonto();
      const inputFoto = fixture.debugElement.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = spyOn(inputFoto, 'click');

      (component as unknown as ComponenteProtegido).abrirSelectorFoto();

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('onFotoSeleccionada sin archivo', () => {
    it('dado un input sin files, no deberia mostrar ningun toast', async () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: null, writable: false });

      await (component as unknown as ComponenteProtegido).onFotoSeleccionada({ target: input } as unknown as Event);

      expect(servicioToast.mostrar).not.toHaveBeenCalled();
    });
  });

  describe('onFotoRecortada', () => {
    it('dado un flujo completo con archivo valido, cuando se recorta, deberia subir la foto y mostrar toast de exito', async () => {
      const original = new File([''], 'foto.jpg', { type: 'image/jpeg' });
      await seleccionarArchivo(original);

      await (component as unknown as ComponenteProtegido).onFotoRecortada(new Blob(['crop'], { type: 'image/webp' }));

      expect(servicioPerfilUsuario.subirFotoPerfil).toHaveBeenCalled();
      const archivoSubido = servicioPerfilUsuario.subirFotoPerfil.calls.mostRecent().args[0] as File;
      expect(archivoSubido.name).toBe('foto.jpg');
      expect(archivoSubido.type).toBe('image/webp');
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Foto de perfil actualizada.', 'success');
    });

    it('dado que subirFotoPerfil falla, cuando se recorta, deberia mostrar toast de error', async () => {
      servicioPerfilUsuario.subirFotoPerfil.and.rejectWith(new Error('boom'));
      await seleccionarArchivo(new File([''], 'foto.jpg', { type: 'image/jpeg' }));

      await (component as unknown as ComponenteProtegido).onFotoRecortada(new Blob(['crop'], { type: 'image/webp' }));

      expect(servicioToast.mostrar).toHaveBeenCalledWith('No se pudo subir la foto. Intentá de nuevo.', 'error');
    });

    it('dado que no hubo seleccion previa, cuando se dispara onFotoRecortada, no deberia subir nada', async () => {
      await (component as unknown as ComponenteProtegido).onFotoRecortada(new Blob(['crop'], { type: 'image/webp' }));

      expect(servicioPerfilUsuario.subirFotoPerfil).not.toHaveBeenCalled();
    });

    it('dado que el input pierde el archivo entre seleccion y recorte, cuando se recorta, no deberia subir nada', async () => {
      await seleccionarArchivo(new File([''], 'foto.jpg', { type: 'image/jpeg' }));
      const eventoPrevio = (component as unknown as ComponenteProtegido).fotoEvent()!;
      Object.defineProperty(eventoPrevio.target as HTMLInputElement, 'files', { value: null, configurable: true });

      await (component as unknown as ComponenteProtegido).onFotoRecortada(new Blob(['crop'], { type: 'image/webp' }));

      expect(servicioPerfilUsuario.subirFotoPerfil).not.toHaveBeenCalled();
    });
  });

  describe('onCancelarRecorte', () => {
    it('dado que habia un archivo seleccionado, cuando cancelo, deberia limpiar el input y el fotoEvent', async () => {
      const archivo = new File([''], 'foto.jpg', { type: 'image/jpeg' });
      await seleccionarArchivo(archivo);
      const input = (component as unknown as ComponenteProtegido).fotoEvent()!.target as HTMLInputElement;
      input.value = 'algo';

      (component as unknown as ComponenteProtegido).onCancelarRecorte();

      expect(input.value).toBe('');
      expect((component as unknown as ComponenteProtegido).fotoEvent()).toBeNull();
    });

    it('dado que no hay foto pendiente, cuando cancelo, no deberia romper', () => {
      expect(() => (component as unknown as ComponenteProtegido).onCancelarRecorte()).not.toThrow();
      expect((component as unknown as ComponenteProtegido).fotoEvent()).toBeNull();
    });
  });

  interface ComponenteProtegido {
    abrirSelectorFoto(): void;
    onFotoSeleccionada(e: Event): Promise<void>;
    onFotoRecortada(blob: Blob): Promise<void>;
    onCancelarRecorte(): void;
    fotoEvent(): Event | null;
  }

  async function seleccionarArchivo(archivo: File): Promise<void> {
    const input = crearInputConArchivo(archivo);
    await (component as unknown as ComponenteProtegido).onFotoSeleccionada({ target: input } as unknown as Event);
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function crearInputConArchivo(archivo: File): HTMLInputElement {
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [archivo], writable: false, configurable: true });
    return input;
  }
});
