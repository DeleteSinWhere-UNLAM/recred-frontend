import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import {
  PerfilUsuario,
  UsuarioLogueado,
} from '../../data-access/models/perfil-usuario.model';
import { PerfilUsuarioPage } from './perfil-usuario.page';
import { PerfilUsuarioService } from '../../data-access/services/perfil-usuario.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ToastService } from '../../shared/services/toast.service';

describe('PerfilUsuarioPage', () => {
  let component: PerfilUsuarioPage;
  let fixture: ComponentFixture<PerfilUsuarioPage>;
  let perfilUsuarioService: jasmine.SpyObj<PerfilUsuarioService>;
  let usuarioService: jasmine.SpyObj<UsuarioService> & {
    esVistaAlumno: ReturnType<typeof signal<boolean>>;
    esVistaKiosquero: ReturnType<typeof signal<boolean>>;
    nombreNavbar: ReturnType<typeof signal<string>>;
  };
  let toastService: jasmine.SpyObj<ToastService>;
  let router: Router;

  const usuario: UsuarioLogueado = {
    id: 'user-1',
    email: 'ana@test.com',
    firstName: 'Ana',
    lastName: 'Tutor',
    role: 'PADRE',
  };

  const perfil: PerfilUsuario = {
    ...usuario,
    phone: '11223344',
    documentNumber: '40111222',
    urlFotoPerfil: 'https://cdn.test/avatar.webp',
  };

  const perfilActualizado: PerfilUsuario = {
    ...perfil,
    firstName: 'Ana Maria',
    phone: '11556677',
    urlFotoPerfil: 'https://cdn.test/avatar-new.webp',
  };

  beforeEach(async () => {
    perfilUsuarioService = jasmine.createSpyObj<PerfilUsuarioService>(
      'PerfilUsuarioService',
      [
        'obtenerUsuarioLogueado',
        'obtenerPerfil',
        'actualizarPerfil',
        'subirFotoPerfil',
      ],
    );
    usuarioService = jasmine.createSpyObj<UsuarioService>(
      'UsuarioService',
      ['homeUrl', 'setNombreNavbar'],
      {
        esVistaAlumno: signal(false),
        esVistaKiosquero: signal(false),
        nombreNavbar: signal('Usuario test'),
      },
    ) as jasmine.SpyObj<UsuarioService> & {
      esVistaAlumno: ReturnType<typeof signal<boolean>>;
      esVistaKiosquero: ReturnType<typeof signal<boolean>>;
      nombreNavbar: ReturnType<typeof signal<string>>;
    };
    toastService = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);

    perfilUsuarioService.obtenerUsuarioLogueado.and.resolveTo(usuario);
    perfilUsuarioService.obtenerPerfil.and.resolveTo(perfil);
    perfilUsuarioService.actualizarPerfil.and.resolveTo(perfilActualizado);
    perfilUsuarioService.subirFotoPerfil.and.resolveTo(perfilActualizado);
    usuarioService.homeUrl.and.returnValue('/kiosquero');

    await TestBed.configureTestingModule({
      imports: [PerfilUsuarioPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { provide: PerfilUsuarioService, useValue: perfilUsuarioService },
        { provide: UsuarioService, useValue: usuarioService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilUsuarioPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
  });

  async function inicializar(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function protegido(): {
    usuario: () => UsuarioLogueado | null;
    perfil: () => PerfilUsuario | null;
    cargando: () => boolean;
    guardando: () => boolean;
    subiendoFoto: () => boolean;
    error: () => string | null;
    fotoEvent: () => Event | null;
    form: {
      controls: Record<string, { setValue: (value: string) => void }>;
      dirty: boolean;
      invalid: boolean;
      pristine: boolean;
      getRawValue: () => Record<string, string>;
      patchValue: (value: Partial<Record<string, string>>) => void;
    };
    nombreNavbar: () => string;
    nombreCompleto: () => string;
    iniciales: () => string;
    fotoPerfil: () => string | null;
    cargarPerfil: () => Promise<void>;
    guardar: () => Promise<void>;
    descartarCambios: () => void;
    abrirSelectorFoto: () => void;
    onFotoSeleccionada: (event: Event) => Promise<void>;
    onFotoRecortada: (blob: Blob) => Promise<void>;
    onCancelarRecorte: () => void;
    volver: () => void;
    campoInvalido: (campo: string) => boolean;
    rolLabel: (role: string | undefined) => string;
  } {
    return component as unknown as ReturnType<typeof protegido>;
  }

  function crearEventoArchivo(archivo?: File): {
    input: HTMLInputElement;
    event: Event;
  } {
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: archivo ? [archivo] : [],
    });
    const event = new Event('change');
    Object.defineProperty(event, 'target', {
      configurable: true,
      value: input,
    });

    return { input, event };
  }

  it('dado que se inicializa, debe cargar usuario, perfil y formulario', async () => {
    await inicializar();

    const page = protegido();

    expect(perfilUsuarioService.obtenerUsuarioLogueado).toHaveBeenCalled();
    expect(perfilUsuarioService.obtenerPerfil).toHaveBeenCalled();
    expect(usuarioService.setNombreNavbar).toHaveBeenCalledWith('Ana');
    expect(page.usuario()).toEqual(usuario);
    expect(page.perfil()).toEqual(perfil);
    expect(page.cargando()).toBeFalse();
    expect(page.error()).toBeNull();
    expect(page.form.getRawValue()).toEqual({
      firstName: 'Ana',
      lastName: 'Tutor',
      phone: '11223344',
      documentNumber: '40111222',
    });
    expect(page.form.pristine).toBeTrue();
    expect(page.nombreNavbar()).toBe('Ana');
    expect(page.nombreCompleto()).toBe('Ana Tutor');
    expect(page.iniciales()).toBe('AT');
    expect(page.fotoPerfil()).toBe('https://cdn.test/avatar.webp');
  });

  it('deberia mostrar error si falla la carga del perfil', async () => {
    perfilUsuarioService.obtenerPerfil.and.rejectWith(new Error('API error'));
    spyOn(console, 'error');

    await inicializar();

    const page = protegido();

    expect(page.cargando()).toBeFalse();
    expect(page.error()).toContain('No pudimos cargar tu perfil');
    expect(console.error).toHaveBeenCalled();
  });

  it('deberia validar el formulario antes de guardar', async () => {
    await inicializar();

    const page = protegido();
    page.form.controls['firstName'].setValue('');

    await page.guardar();

    expect(page.campoInvalido('firstName')).toBeTrue();
    expect(toastService.mostrar).toHaveBeenCalledWith(
      jasmine.stringMatching(/campos marcados/),
      'error',
    );
    expect(perfilUsuarioService.actualizarPerfil).not.toHaveBeenCalled();
  });

  it('deberia avisar cuando no hay cambios para guardar', async () => {
    await inicializar();

    await protegido().guardar();

    expect(toastService.mostrar).toHaveBeenCalledWith(
      'No hay cambios para guardar.',
      'info',
    );
    expect(perfilUsuarioService.actualizarPerfil).not.toHaveBeenCalled();
  });

  it('deberia guardar solo los cambios reales y actualizar estado local', async () => {
    await inicializar();

    const page = protegido();
    page.form.patchValue({
      firstName: '  Ana Maria  ',
      phone: '  11556677  ',
    });

    await page.guardar();

    expect(perfilUsuarioService.actualizarPerfil).toHaveBeenCalledWith({
      firstName: 'Ana Maria',
      phone: '11556677',
    });
    expect(page.guardando()).toBeFalse();
    expect(page.perfil()).toEqual(perfilActualizado);
    expect(page.usuario()?.firstName).toBe('Ana Maria');
    expect(usuarioService.setNombreNavbar).toHaveBeenCalledWith('Ana Maria');
    expect(toastService.mostrar).toHaveBeenCalledWith(
      'Perfil actualizado correctamente.',
      'success',
    );
  });

  it('deberia mostrar toast si falla el guardado', async () => {
    await inicializar();

    perfilUsuarioService.actualizarPerfil.and.rejectWith(new Error('API error'));
    spyOn(console, 'error');

    const page = protegido();
    page.form.controls['lastName'].setValue('Tutor Editado');

    await page.guardar();

    expect(page.guardando()).toBeFalse();
    expect(toastService.mostrar).toHaveBeenCalledWith(
      'No se pudo actualizar el perfil.',
      'error',
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('deberia descartar cambios y dejar el formulario pristine', async () => {
    await inicializar();

    const page = protegido();
    page.form.controls['firstName'].setValue('Otro nombre');

    page.descartarCambios();

    expect(page.form.getRawValue()).toEqual({
      firstName: 'Ana',
      lastName: 'Tutor',
      phone: '11223344',
      documentNumber: '40111222',
    });
    expect(page.form.pristine).toBeTrue();
  });

  it('deberia abrir el selector de foto desde el boton', async () => {
    await inicializar();

    const input = fixture.nativeElement.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const clickSpy = spyOn(input, 'click');

    protegido().abrirSelectorFoto();

    expect(clickSpy).toHaveBeenCalled();
  });

  it('deberia validar tipo y tamanio de la foto seleccionada', async () => {
    await inicializar();

    const page = protegido();
    const archivoPdf = new File(['pdf'], 'perfil.pdf', {
      type: 'application/pdf',
    });
    const archivoGrande = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      'perfil.png',
      { type: 'image/png' },
    );

    await page.onFotoSeleccionada(crearEventoArchivo(archivoPdf).event);
    await page.onFotoSeleccionada(crearEventoArchivo(archivoGrande).event);

    expect(toastService.mostrar).toHaveBeenCalledWith(
      jasmine.stringMatching(/JPG, PNG o WEBP/),
      'error',
    );
    expect(toastService.mostrar).toHaveBeenCalledWith(
      jasmine.stringMatching(/5 MB/),
      'error',
    );
    expect(page.fotoEvent()).toBeNull();
  });

  it('deberia subir la foto recortada y limpiar el input', async () => {
    await inicializar();

    const page = protegido();
    const archivo = new File(['foto'], 'perfil.png', { type: 'image/png' });
    const { input, event } = crearEventoArchivo(archivo);

    await page.onFotoSeleccionada(event);
    await page.onFotoRecortada(new Blob(['webp'], { type: 'image/webp' }));

    const archivoSubido =
      perfilUsuarioService.subirFotoPerfil.calls.mostRecent().args[0];

    expect(archivoSubido).toEqual(jasmine.any(File));
    expect(archivoSubido.name).toBe('perfil.png');
    expect(archivoSubido.type).toBe('image/webp');
    expect(page.subiendoFoto()).toBeFalse();
    expect(page.fotoEvent()).toBeNull();
    expect(page.fotoPerfil()).toBe('https://cdn.test/avatar-new.webp');
    expect(input.value).toBe('');
    expect(toastService.mostrar).toHaveBeenCalledWith(
      'Foto de perfil actualizada.',
      'success',
    );
  });

  it('deberia mostrar error si falla la subida de foto', async () => {
    await inicializar();

    perfilUsuarioService.subirFotoPerfil.and.rejectWith(new Error('upload error'));

    const page = protegido();
    const archivo = new File(['foto'], 'perfil.webp', { type: 'image/webp' });
    const { event } = crearEventoArchivo(archivo);

    await page.onFotoSeleccionada(event);
    await page.onFotoRecortada(new Blob(['webp'], { type: 'image/webp' }));

    expect(page.subiendoFoto()).toBeFalse();
    expect(toastService.mostrar).toHaveBeenCalledWith(
      jasmine.stringMatching(/No se pudo subir la foto/),
      'error',
    );
  });

  it('deberia cancelar el recorte y volver al home configurado', async () => {
    await inicializar();

    const page = protegido();
    const archivo = new File(['foto'], 'perfil.webp', { type: 'image/webp' });
    const { input, event } = crearEventoArchivo(archivo);

    await page.onFotoSeleccionada(event);
    page.onCancelarRecorte();
    page.volver();

    expect(page.fotoEvent()).toBeNull();
    expect(input.value).toBe('');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
  });

  it('deberia resolver las etiquetas de rol conocidas y por defecto', () => {
    const page = protegido();

    expect(page.rolLabel('PADRE')).toBe('Tutor');
    expect(page.rolLabel('ALUMNO')).toBe('Alumno');
    expect(page.rolLabel('VENDEDOR')).toBe('Kiosquero');
    expect(page.rolLabel(undefined)).toBe('Usuario');
  });
});
