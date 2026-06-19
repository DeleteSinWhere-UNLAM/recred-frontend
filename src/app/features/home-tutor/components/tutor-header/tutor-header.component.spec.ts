import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TutorHeaderComponent } from './tutor-header.component';
import { PerfilUsuarioService } from '../../../../data-access/services/perfil-usuario.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { PerfilUsuario } from '../../../../data-access/models/perfil-usuario.model';

// ─── Suite de pruebas ─────────────────────────────────────────────────────────

describe('TutorHeaderComponent', () => {
  let componente: TutorHeaderComponent;
  let fixture: ComponentFixture<TutorHeaderComponent>;
  let perfilUsuarioServiceEspia: jasmine.SpyObj<PerfilUsuarioService>;
  let toastServiceEspia: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    perfilUsuarioServiceEspia = jasmine.createSpyObj<PerfilUsuarioService>(
      'PerfilUsuarioService',
      ['subirFotoPerfil']
    );
    toastServiceEspia = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);

    await TestBed.configureTestingModule({
      imports: [TutorHeaderComponent],
      providers: [
        { provide: PerfilUsuarioService, useValue: perfilUsuarioServiceEspia },
        { provide: ToastService, useValue: toastServiceEspia },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TutorHeaderComponent);
    componente = fixture.componentInstance;

    // Inputs requeridos por defecto
    fixture.componentRef.setInput('iniciales', 'JP');
    fixture.componentRef.setInput('nombreCompleto', 'Juan Pérez');
    fixture.componentRef.setInput('urlFotoPerfil', null);
    fixture.componentRef.setInput('cantidadHijos', 2);
    fixture.componentRef.setInput('cantidadColegios', 1);
    fixture.componentRef.setInput('saldoTotalFormateado', '$5.000');
    fixture.detectChanges();
  });

  // ── Creación ──────────────────────────────────────────────────────────────

  it('dado que se inicializa con todos los inputs requeridos, debe crearse correctamente', () => {
    expect(componente).toBeTruthy();
  });

  // ── get resumenHijos ──────────────────────────────────────────────────────

  it('dado 1 hijo y 1 colegio, resumenHijos debe retornar "1 hijo" (singular, sin colegios)', () => {
    fixture.componentRef.setInput('cantidadHijos', 1);
    fixture.componentRef.setInput('cantidadColegios', 1);
    expect(componente.resumenHijos).toBe('1 hijo');
  });

  it('dado 2 hijos y 1 colegio, resumenHijos debe retornar "2 hijos" (sin colegios porque es solo 1)', () => {
    fixture.componentRef.setInput('cantidadHijos', 2);
    fixture.componentRef.setInput('cantidadColegios', 1);
    expect(componente.resumenHijos).toBe('2 hijos');
  });

  it('dado 3 hijos y 2 colegios, resumenHijos debe incluir la cantidad de colegios', () => {
    fixture.componentRef.setInput('cantidadHijos', 3);
    fixture.componentRef.setInput('cantidadColegios', 2);
    expect(componente.resumenHijos).toBe('3 hijos · 2 colegios');
  });

  it('dado 1 hijo y 2 colegios, resumenHijos debe usar singular para hijo y mostrar colegios', () => {
    fixture.componentRef.setInput('cantidadHijos', 1);
    fixture.componentRef.setInput('cantidadColegios', 2);
    expect(componente.resumenHijos).toBe('1 hijo · 2 colegios');
  });

  // ── @Input: nombreCompleto ────────────────────────────────────────────────

  it('dado que recibe nombreCompleto, debe mostrarlo en el h1', () => {
    const nombre = fixture.debugElement.query(By.css('.tutor-header__nombre'));
    expect(nombre.nativeElement.textContent).toContain('Juan Pérez');
  });

  it('dado que recibe nombreCompleto, el aria-label de la sección debe incluir el nombre', () => {
    const seccion = fixture.debugElement.query(By.css('.tutor-header'));
    expect(seccion.nativeElement.getAttribute('aria-label')).toBe('Perfil de Juan Pérez');
  });

  // ── @Input: saldoTotalFormateado ──────────────────────────────────────────

  it('dado que recibe saldoTotalFormateado, debe mostrarlo en el panel de saldo', () => {
    const saldo = fixture.debugElement.query(By.css('.tutor-header__saldo-valor'));
    expect(saldo.nativeElement.textContent).toContain('$5.000');
  });

  // ── @if (urlFotoPerfil) → rama SIN foto ───────────────────────────────────

  it('dado que urlFotoPerfil es null, debe mostrar las iniciales en el avatar', () => {
    const iniciales = fixture.debugElement.query(By.css('.tutor-header__avatar span'));
    expect(iniciales.nativeElement.textContent).toContain('JP');
  });

  it('dado que urlFotoPerfil es null, NO debe mostrar la imagen del avatar', () => {
    const foto = fixture.debugElement.query(By.css('.tutor-header__avatar-img'));
    expect(foto).toBeNull();
  });

  // ── @if (urlFotoPerfil) → rama CON foto ───────────────────────────────────

  it('dado que urlFotoPerfil tiene valor, debe renderizar la imagen con el src correcto', () => {
    fixture.componentRef.setInput('urlFotoPerfil', 'https://cdn.foto.com/perfil.jpg');
    fixture.detectChanges();

    const foto = fixture.debugElement.query(By.css('.tutor-header__avatar-img'));
    expect(foto).not.toBeNull();
    expect(foto.nativeElement.getAttribute('src')).toBe('https://cdn.foto.com/perfil.jpg');
  });

  // ── @if (subiendoFoto) → loader vs ícono editar ───────────────────────────

  it('dado que subiendoFoto es false, debe mostrar el ícono de lápiz en el botón de editar', () => {
    const icono = fixture.debugElement.query(By.css('.tutor-header__avatar-editar .fa-pen'));
    expect(icono).not.toBeNull();
  });

  it('dado que subiendoFoto es true, debe mostrar el loader en el botón de editar', () => {
    componente['subiendoFoto'].set(true);
    fixture.detectChanges();

    const loader = fixture.debugElement.query(By.css('.tutor-header__avatar-loader'));
    expect(loader).not.toBeNull();
  });

  // ── onFotoSeleccionada ────────────────────────────────────────────────────

  it('dado que se selecciona un archivo sin archivos, no debe actualizar fotoEvent', async () => {
    const eventoSinArchivos = { target: { files: null } } as unknown as Event;
    await (componente as any).onFotoSeleccionada(eventoSinArchivos);

    expect(componente['fotoEvent']()).toBeNull();
  });

  it('dado que se selecciona un archivo con tipo no permitido, debe mostrar un toast de error', async () => {
    const archivoInvalido = new File(['gif'], 'imagen.gif', { type: 'image/gif' });
    const eventoInvalido = {
      target: { files: [archivoInvalido], value: '' },
    } as unknown as Event;

    await (componente as any).onFotoSeleccionada(eventoInvalido);

    expect(toastServiceEspia.mostrar).toHaveBeenCalledWith(
      'Solo se permiten imágenes JPG, PNG o WEBP.',
      'error'
    );
  });

  it('dado que se selecciona un archivo que supera 5 MB, debe mostrar un toast de error', async () => {
    const archivoGrande = new File([new ArrayBuffer(6 * 1024 * 1024)], 'grande.png', {
      type: 'image/png',
    });
    const eventoGrande = {
      target: { files: [archivoGrande], value: '' },
    } as unknown as Event;

    await (componente as any).onFotoSeleccionada(eventoGrande);

    expect(toastServiceEspia.mostrar).toHaveBeenCalledWith(
      'La imagen no puede superar los 5 MB.',
      'error'
    );
  });

  it('dado que se selecciona un archivo válido, debe actualizar fotoEvent', async () => {
    const archivoValido = new File(['img'], 'foto.png', { type: 'image/png' });
    const eventoValido = {
      target: { files: [archivoValido], value: '' },
    } as unknown as Event;

    await (componente as any).onFotoSeleccionada(eventoValido);

    expect(componente['fotoEvent']()).toBe(eventoValido);
  });

  // ── @if (fotoEvent) → CropModal ──────────────────────────────────────────

  it('dado que fotoEvent es null, NO debe mostrar el app-crop-modal', () => {
    const modal = fixture.debugElement.query(By.css('app-crop-modal'));
    expect(modal).toBeNull();
  });

  // ── onFotoRecortada ────────────────────────────────────────────────────────

  it('dado que fotoEvent es null, onFotoRecortada no debe llamar a subirFotoPerfil', async () => {
    componente['fotoEvent'].set(null);
    const blob = new Blob(['img'], { type: 'image/webp' });

    await (componente as any).onFotoRecortada(blob);

    expect(perfilUsuarioServiceEspia.subirFotoPerfil).not.toHaveBeenCalled();
  });

  it('dado fotoEvent con archivo válido, onFotoRecortada debe subir la foto y mostrar toast de éxito', async () => {
    const archivoValido = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });
    const eventoValido = {
      target: { files: [archivoValido], value: '' },
    } as unknown as Event;
    componente['fotoEvent'].set(eventoValido);

    perfilUsuarioServiceEspia.subirFotoPerfil.and.resolveTo({} as PerfilUsuario);

    const blob = new Blob(['img'], { type: 'image/webp' });
    await (componente as any).onFotoRecortada(blob);

    expect(perfilUsuarioServiceEspia.subirFotoPerfil).toHaveBeenCalled();
    expect(toastServiceEspia.mostrar).toHaveBeenCalledWith('Foto de perfil actualizada.', 'success');
  });

  it('dado que subirFotoPerfil falla, onFotoRecortada debe mostrar toast de error', async () => {
    const archivoValido = new File(['img'], 'foto.jpg', { type: 'image/jpeg' });
    const eventoValido = {
      target: { files: [archivoValido], value: '' },
    } as unknown as Event;
    componente['fotoEvent'].set(eventoValido);

    perfilUsuarioServiceEspia.subirFotoPerfil.and.rejectWith(new Error('Error'));

    const blob = new Blob(['img'], { type: 'image/webp' });
    await (componente as any).onFotoRecortada(blob);

    expect(toastServiceEspia.mostrar).toHaveBeenCalledWith(
      'No se pudo subir la foto. Intentá de nuevo.',
      'error'
    );
  });

  it('dado que fotoEvent tiene evento pero input.files está vacío, onFotoRecortada no sube la foto', async () => {
    const eventoSinFiles = {
      target: { files: [], value: '' },
    } as unknown as Event;
    componente['fotoEvent'].set(eventoSinFiles);

    const blob = new Blob(['img'], { type: 'image/webp' });
    await (componente as any).onFotoRecortada(blob);

    expect(perfilUsuarioServiceEspia.subirFotoPerfil).not.toHaveBeenCalled();
  });

  // ── onCancelarRecorte ─────────────────────────────────────────────────────

  it('dado que fotoEvent tiene evento, onCancelarRecorte debe limpiar el input y fotoEvent', () => {
    const inputMock = { value: 'algo' };
    const eventoConInput = { target: inputMock } as unknown as Event;
    componente['fotoEvent'].set(eventoConInput);

    (componente as any).onCancelarRecorte();

    expect(componente['fotoEvent']()).toBeNull();
    expect(inputMock.value).toBe('');
  });

  it('dado que fotoEvent es null, onCancelarRecorte no debe lanzar error', () => {
    componente['fotoEvent'].set(null);
    expect(() => (componente as any).onCancelarRecorte()).not.toThrow();
  });
});
