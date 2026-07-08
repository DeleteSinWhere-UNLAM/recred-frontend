import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  PerfilUsuario,
  UsuarioLogueado,
} from '../../data-access/models/perfil-usuario.model';
import { PayoutConfig } from '../../data-access/models/payout-config.model';
import { PayoutConfigService } from '../home-kiosquero/services/payout-config.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { PerfilUsuarioService } from '../../data-access/services/perfil-usuario.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { CropModalComponent } from './components/crop-modal/crop-modal.component';
import { PerfilUsuarioPage } from './perfil-usuario.page';

interface WritableSignalLike<T> {
  (): T;
  set(value: T): void;
  update(fn: (current: T) => T): void;
}

interface PerfilUsuarioOverride {
  firstName?: string;
  lastName?: string;
  role?: 'PADRE' | 'ALUMNO' | 'VENDEDOR' | 'DIRECTIVO_COLEGIO';
  phone?: string | null;
  documentNumber?: string | null;
  urlFotoPerfil?: string | null;
  fechaVencimientoPlan?: string | null;
  estadoLicenciaColegio?: string | null;
  fechaVencimientoLicenciaColegio?: string | null;
}

interface ToastEsperado {
  matcher: string | RegExp | jasmine.AsymmetricMatcher<string>;
  tipo: 'success' | 'error' | 'info';
}

interface CamposForm {
  firstName?: string;
  lastName?: string;
  phone?: string;
  documentNumber?: string;
}

interface PayoutFormValor {
  destinationCvu?: string;
  destinationCuit?: string;
  accountHolderName?: string;
  cantidadIntervalo?: number;
  unidadIntervalo?: string;
  estado?: string;
}

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

@Component({ selector: 'app-crop-modal', template: '', standalone: true })
class CropModalStub {
  @Input() imageEvent: Event | null = null;
  @Output() cropped = new EventEmitter<Blob>();
  @Output() canceled = new EventEmitter<void>();
}

class UsuarioLogueadoMother {
  static crear(override: PerfilUsuarioOverride = {}): UsuarioLogueado {
    return {
      id: 'usuario-1',
      email: 'test@recred.com',
      firstName: 'Martín',
      lastName: 'García',
      role: 'PADRE',
      ...override,
    };
  }
}

class PerfilUsuarioMother {
  static crear(override: PerfilUsuarioOverride = {}): PerfilUsuario {
    return {
      ...UsuarioLogueadoMother.crear(override),
      phone: '1122334455',
      documentNumber: '12345678',
      urlFotoPerfil: null,
      ...override,
    };
  }
}

class PayoutConfigMother {
  static crearCompleta(override: Partial<PayoutConfig> = {}): PayoutConfig {
    return {
      destinationCvu: '1'.repeat(22),
      destinationCuit: '2'.repeat(11),
      accountHolderName: 'Titular',
      cantidadIntervalo: 1,
      unidadIntervalo: 'DAYS',
      estado: 'ACTIVE',
      ...override,
    } as PayoutConfig;
  }
}

describe('PerfilUsuarioPage', () => {
  let component: PerfilUsuarioPage;
  let fixture: ComponentFixture<PerfilUsuarioPage>;
  let router: Router;
  let servicioPerfilUsuario: jasmine.SpyObj<PerfilUsuarioService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioPayout: jasmine.SpyObj<PayoutConfigService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let homeUrlSignal: ReturnType<typeof signal<string>>;
  let nombreNavbarSignal: ReturnType<typeof signal<string>>;
  let esVistaAlumnoSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    homeUrlSignal = signal('/tutor');
    nombreNavbarSignal = signal('');
    esVistaAlumnoSignal = signal(false);

    servicioPerfilUsuario = jasmine.createSpyObj<PerfilUsuarioService>('PerfilUsuarioService', [
      'obtenerUsuarioLogueado',
      'obtenerPerfil',
      'actualizarPerfil',
      'subirFotoPerfil',
    ]);
    servicioUsuario = jasmine.createSpyObj<UsuarioService>(
      'UsuarioService',
      ['setNombreNavbar', 'setHomeUrl'],
      {
        homeUrl: homeUrlSignal.asReadonly(),
        nombreNavbar: nombreNavbarSignal.asReadonly(),
        esVistaAlumno: esVistaAlumnoSignal.asReadonly(),
      },
    );
    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', ['perfil', 'obtenerBuffetId']);
    servicioPayout = jasmine.createSpyObj<PayoutConfigService>('PayoutConfigService', [
      'obtenerConfiguracion',
      'guardarConfiguracion',
    ]);
    servicioToast = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);

    givenUsuarioLogueado(UsuarioLogueadoMother.crear());
    givenPerfilCargado(PerfilUsuarioMother.crear());
    servicioPerfil.perfil.and.returnValue({ plan: 'AVANZADO' } as never);

    await TestBed.configureTestingModule({
      imports: [PerfilUsuarioPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PerfilUsuarioService, useValue: servicioPerfilUsuario },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: PayoutConfigService, useValue: servicioPayout },
        { provide: ToastService, useValue: servicioToast },
      ],
    })
      .overrideComponent(PerfilUsuarioPage, {
        remove: { imports: [NavbarComponent, CropModalComponent] },
        add: { imports: [NavbarStub, CropModalStub] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(PerfilUsuarioPage);
    component = fixture.componentInstance;
  });

  describe('carga inicial', () => {
    it('dado un tutor logueado, cuando se monta, deberia cargar usuario y perfil y setear /tutor como home', fakeAsync(() => {
      whenMontoYAvanzo();

      thenSeCargaronUsuarioYPerfil();
      thenSeSeteoNombreNavbar('Martín');
      thenSeSeteoHomeUrl('/tutor');
    }));

    it('dado un kiosquero logueado, cuando se monta, deberia setear /kiosquero y cargar la config de payout', fakeAsync(() => {
      givenUsuarioConRol('VENDEDOR');
      givenPayoutExistente(PayoutConfigMother.crearCompleta());

      whenMontoYAvanzoDosTicks();

      thenSeSeteoHomeUrl('/kiosquero');
      thenSePidioLaConfigDeKiosquero('usuario-1');
    }));

    it('dado un alumno logueado, cuando se monta, deberia setear /alumno como home', fakeAsync(() => {
      givenUsuarioConRol('ALUMNO');

      whenMontoYAvanzo();

      thenSeSeteoHomeUrl('/alumno');
    }));

    it('dado un directivo logueado, cuando se monta, deberia setear /directivo como home', fakeAsync(() => {
      givenUsuarioConRol('DIRECTIVO_COLEGIO');

      whenMontoYAvanzo();

      thenSeSeteoHomeUrl('/directivo');
    }));

    it('dado que la carga falla, cuando se monta, deberia setear el mensaje de error', fakeAsync(() => {
      spyOn(console, 'error');
      givenObtenerUsuarioLogueadoFalla();

      whenMontoYAvanzo();

      thenElErrorContiene('No pudimos cargar tu perfil');
    }));
  });

  describe('guardar', () => {
    beforeEach(fakeAsync(() => {
      whenMontoYAvanzo();
    }));

    it('dado el form invalido, cuando guardo, deberia mostrar toast de error y no llamar al service', fakeAsync(() => {
      whenSeteoCampos({ firstName: '' });

      whenGuardoYAvanzo();

      thenSeMostroToast({ matcher: jasmine.stringMatching(/Revisá/i), tipo: 'error' });
      thenNoSeActualizoElPerfil();
    }));

    it('dado el form sin cambios, cuando guardo, deberia mostrar el toast de "sin cambios"', fakeAsync(() => {
      whenGuardoYAvanzo();

      thenSeMostroToast({ matcher: 'No hay cambios para guardar.', tipo: 'info' });
      thenNoSeActualizoElPerfil();
    }));

    it('dado cambios validos, cuando guardo, deberia llamar al service y mostrar toast de exito', fakeAsync(() => {
      givenActualizarPerfilResuelve(PerfilUsuarioMother.crear({ firstName: 'Nuevo' }));
      whenSeteoCampos({ firstName: 'Nuevo' });

      whenGuardoYAvanzo();

      thenSeActualizoElPerfilCon({ firstName: 'Nuevo' });
      thenSeMostroToast({ matcher: 'Perfil actualizado correctamente.', tipo: 'success' });
    }));

    it('dado que actualizarPerfil falla, cuando guardo, deberia mostrar el toast de error', fakeAsync(() => {
      spyOn(console, 'error');
      givenActualizarPerfilFalla();
      whenSeteoCampos({ firstName: 'Nuevo' });

      whenGuardoYAvanzo();

      thenSeMostroToast({ matcher: 'No se pudo actualizar el perfil.', tipo: 'error' });
    }));

    it('dado guardando en curso, cuando guardo de nuevo, no deberia llamar al service', fakeAsync(() => {
      givenGuardandoEnCurso();
      whenSeteoCampos({ firstName: 'Nuevo' });

      whenGuardoYAvanzo();

      thenNoSeActualizoElPerfil();
    }));

    it('dado cargando en curso, cuando guardo, no deberia llamar al service', fakeAsync(() => {
      givenCargandoEnCurso();
      whenSeteoCampos({ firstName: 'Nuevo' });

      whenGuardoYAvanzo();

      thenNoSeActualizoElPerfil();
    }));
  });

  describe('descartar cambios', () => {
    it('dado cambios sin guardar, cuando descarto, deberia volver a los valores originales', fakeAsync(() => {
      whenMontoYAvanzo();
      whenSeteoCampos({ firstName: 'Otro' });

      whenDescarto();

      thenElCampoTieneValor('firstName', 'Martín');
    }));

    it('dado sin perfil cargado, cuando descarto, no deberia romper', fakeAsync(() => {
      whenMontoYAvanzo();
      givenPerfilVacio();

      whenDescarto();

      expect(true).toBeTrue();
    }));
  });

  describe('foto de perfil', () => {
    beforeEach(fakeAsync(() => {
      whenMontoYAvanzo();
    }));

    it('dado abrirSelectorFoto, cuando lo llamo, deberia disparar click en el input file', () => {
      const clickSpy = spyOnClickDelInputFoto();

      whenAbroSelectorFoto();

      expect(clickSpy).toHaveBeenCalled();
    });

    it('dado una imagen JPG, cuando la selecciono, deberia guardar el event para el crop modal', fakeAsync(() => {
      const event = givenEventoConArchivo('foto.jpg', 'image/jpeg', 1024);

      whenSeleccionoFoto(event);

      thenElFotoEventEs(event);
    }));

    it('dado un archivo con tipo no permitido, cuando lo selecciono, deberia mostrar toast de error y no guardar event', fakeAsync(() => {
      const event = givenEventoConArchivo('doc.pdf', 'application/pdf', 1024);

      whenSeleccionoFoto(event);

      thenSeMostroToast({ matcher: jasmine.stringMatching(/JPG, PNG o WEBP/i), tipo: 'error' });
      thenElFotoEventEs(null);
    }));

    it('dado un archivo mayor a 5MB, cuando lo selecciono, deberia mostrar toast de error', fakeAsync(() => {
      const event = givenEventoConArchivo('foto.jpg', 'image/jpeg', 6 * 1024 * 1024);

      whenSeleccionoFoto(event);

      thenSeMostroToast({ matcher: jasmine.stringMatching(/5 MB/i), tipo: 'error' });
    }));

    it('dado onFotoSeleccionada sin archivo, no deberia setear el fotoEvent', fakeAsync(() => {
      const event = givenEventoSinArchivo();

      whenSeleccionoFoto(event);

      thenElFotoEventEs(null);
    }));

    it('dado una foto recortada, cuando confirmo, deberia subir la foto y mostrar toast de exito', fakeAsync(() => {
      givenSubirFotoResuelve(PerfilUsuarioMother.crear({ urlFotoPerfil: 'https://cdn/foto.webp' }));
      const event = givenEventoConArchivo('foto.jpg', 'image/jpeg', 1024);
      whenSeleccionoFoto(event);

      whenRecortoFoto(new Blob(['x'], { type: 'image/webp' }));

      thenSeSubioLaFoto();
      thenSeMostroToast({ matcher: 'Foto de perfil actualizada.', tipo: 'success' });
    }));

    it('dado onFotoRecortada sin fotoEvent previo, no deberia subir la foto', fakeAsync(() => {
      whenRecortoFoto(new Blob(['x'], { type: 'image/webp' }));

      thenNoSeSubioLaFoto();
    }));

    it('dado onFotoRecortada sin originalFile, no deberia subir la foto', fakeAsync(() => {
      givenFotoEventConInputSinArchivo();

      whenRecortoFoto(new Blob(['x'], { type: 'image/webp' }));

      thenNoSeSubioLaFoto();
    }));

    it('dado que subir la foto falla, cuando recorto, deberia mostrar toast de error', fakeAsync(() => {
      givenSubirFotoFalla();
      const event = givenEventoConArchivo('foto.jpg', 'image/jpeg', 1024);
      whenSeleccionoFoto(event);

      whenRecortoFoto(new Blob(['x'], { type: 'image/webp' }));

      thenSeMostroToast({ matcher: jasmine.stringMatching(/No se pudo subir la foto/i), tipo: 'error' });
    }));

    it('dado un recorte cancelado con event previo, cuando cancelo, deberia limpiar el fotoEvent', fakeAsync(() => {
      const event = givenEventoConArchivo('foto.jpg', 'image/jpeg', 1024);
      whenSeleccionoFoto(event);

      whenCanceloRecorte();

      thenElFotoEventEs(null);
    }));

    it('dado onCancelarRecorte sin event previo, no deberia romper', () => {
      whenCanceloRecorte();

      thenElFotoEventEs(null);
    });
  });

  describe('navegacion y helpers', () => {
    it('dado el homeUrl configurado, cuando llamo volver, deberia navegar a ese home', fakeAsync(() => {
      givenHomeUrl('/kiosquero');
      whenMontoYAvanzo();

      whenVuelvo();

      thenSeNavegoA('/kiosquero');
    }));

    it('dado rolLabel con cada rol, cuando lo llamo, deberia devolver el label correspondiente', () => {
      thenRolLabelEs('PADRE', 'Tutor');
      thenRolLabelEs('ALUMNO', 'Alumno');
      thenRolLabelEs('VENDEDOR', 'Kiosquero');
      thenRolLabelEs('DIRECTIVO_COLEGIO', 'Directivo');
      thenRolLabelEs(undefined, 'Usuario');
    });

    it('dado campoInvalido con firstName invalido y touched, deberia devolver true', () => {
      fixture.detectChanges();
      whenSeteoCampos({ firstName: '' });
      whenMarcoTouched('firstName');

      thenCampoInvalidoEs('firstName', true);
    });

    it('dado campoInvalido con firstName valido, deberia devolver false', () => {
      fixture.detectChanges();

      thenCampoInvalidoEs('firstName', false);
    });

    it('dado sin perfil, cuando leo nombreCompleto, deberia devolver "Mi perfil"', fakeAsync(() => {
      whenMontoYAvanzo();
      givenPerfilVacio();

      thenNombreCompletoEs('Mi perfil');
    }));

    it('dado sin perfil, cuando leo iniciales, deberia devolver "U"', fakeAsync(() => {
      whenMontoYAvanzo();
      givenPerfilVacio();

      thenInicialesSon('U');
    }));
  });

  describe('payout (kiosquero)', () => {
    beforeEach(fakeAsync(() => {
      givenUsuarioConRol('VENDEDOR');
      givenSinConfigDePayout();
      whenMontoYAvanzoDosTicks();
    }));

    it('dado el form payout invalido, cuando guardo, deberia mostrar toast de error', fakeAsync(() => {
      whenGuardoPayoutYAvanzo();

      thenSeMostroToast({ matcher: jasmine.stringMatching(/configuración de pagos/i), tipo: 'error' });
      thenNoSeGuardoElPayout();
    }));

    it('dado un payout valido, cuando guardo, deberia llamar al service y mostrar exito', fakeAsync(() => {
      givenGuardarPayoutResuelve({ proximaEjecucion: '2026-08-01' });
      whenCompletoPayoutForm();

      whenGuardoPayoutYAvanzo();

      thenSeGuardoElPayout();
      thenSeMostroToast({ matcher: jasmine.stringMatching(/Vinculación exitosa/i), tipo: 'success' });
    }));

    it('dado que guardar payout falla, cuando guardo, deberia mostrar toast de error', fakeAsync(() => {
      spyOn(console, 'error');
      givenGuardarPayoutFalla();
      whenCompletoPayoutForm();

      whenGuardoPayoutYAvanzo();

      thenSeMostroToast({ matcher: jasmine.stringMatching(/No se pudo procesar/i), tipo: 'error' });
    }));

    it('dado guardandoPayout en curso, cuando guardo, no deberia llamar al service', fakeAsync(() => {
      givenGuardandoPayoutEnCurso();
      whenCompletoPayoutForm();

      whenGuardoPayoutYAvanzo();

      thenNoSeGuardoElPayout();
    }));

    it('dado guardarPayout sin kiosqueroId, cuando guardo, deberia mostrar toast y no llamar al service', fakeAsync(() => {
      givenSinKiosqueroId();
      whenCompletoPayoutForm();

      whenGuardoPayoutYAvanzo();

      thenSeMostroToast({ matcher: jasmine.stringMatching(/ID del kiosquero/i), tipo: 'error' });
      thenNoSeGuardoElPayout();
    }));

    it('dado descartarCambiosPayout, cuando lo llamo, deberia recargar la configuracion', fakeAsync(() => {
      resetGetConfiguracion();

      whenDescartoCambiosPayout();

      thenSePidioLaConfigDePayout();
    }));

    it('dado campoPayoutInvalido con destinationCvu invalido y touched, deberia devolver true', () => {
      whenSeteoPayoutFormControl('destinationCvu', '123');
      whenMarcoTouchedPayout('destinationCvu');

      thenCampoPayoutInvalidoEs('destinationCvu', true);
    });
  });

  describe('branches puntuales — payout con fields ausentes', () => {
    it('dado un payout config con todos los fields en falsy, cuando cargo, deberia hidratar el form con defaults', fakeAsync(() => {
      servicioPerfil.obtenerBuffetId.and.returnValue('kiosco-1');
      givenPayoutExistente({} as unknown as PayoutConfig);

      whenMontoYAvanzo();

      thenElPayoutFormEs({
        destinationCvu: '',
        destinationCuit: '',
        accountHolderName: '',
        cantidadIntervalo: 1,
        unidadIntervalo: 'DAYS',
        estado: 'ACTIVE',
      });
    }));

    it('dado un guardarConfiguracion sin proximaEjecucion, proximaEjecucion signal deberia quedar null', fakeAsync(() => {
      givenUsuarioConRol('VENDEDOR');
      givenSinConfigDePayout();
      whenMontoYAvanzoDosTicks();
      givenGuardarPayoutResuelve({} as unknown as PayoutConfig);
      whenCompletoPayoutForm();

      whenGuardoPayoutYAvanzo();

      thenLaProximaEjecucionEs(null);
    }));

    it('dado cargarConfiguracionPayout sin kiosqueroId, cuando lo llamo, deberia loguear warn y no llamar al service', fakeAsync(() => {
      spyOn(console, 'warn');
      givenUsuarioConRol('VENDEDOR');
      givenSinConfigDePayout();
      whenMontoYAvanzoDosTicks();
      givenSinKiosqueroId();
      resetGetConfiguracion();

      whenLlamoCargarConfiguracionPayout();

      expect(console.warn).toHaveBeenCalled();
      thenNoSePidioLaConfigDePayout();
    }));

    it('dado cargarConfiguracionPayout que falla, cuando lo llamo, deberia setear tienePayoutExistente false', fakeAsync(() => {
      spyOn(console, 'warn');
      givenUsuarioConRol('VENDEDOR');
      givenSinConfigDePayout();
      whenMontoYAvanzoDosTicks();
      givenObtenerConfiguracionFalla();

      whenLlamoCargarConfiguracionPayout();

      thenTienePayoutExistenteEs(false);
    }));
  });

  describe('branches puntuales — perfil sin fields opcionales', () => {
    it('dado un perfil con firstName/lastName/phone/documentNumber undefined, cuando cargo, form deberia hidratarse con ""', fakeAsync(() => {
      givenUsuarioLogueado(UsuarioLogueadoMother.crear());
      givenPerfilCargado({
        id: 'x', email: 'x', firstName: undefined, lastName: undefined, role: 'PADRE',
        phone: undefined, documentNumber: undefined, urlFotoPerfil: null,
      } as unknown as PerfilUsuario);

      whenMontoYAvanzo();

      thenElCampoTieneValor('firstName', '');
      thenElCampoTieneValor('lastName', '');
      thenElCampoTieneValor('phone', '');
      thenElCampoTieneValor('documentNumber', '');
    }));
  });

  describe('branches puntuales — plan y esPremium', () => {
    it('dado plan AVANZADO, esPremium deberia ser true', fakeAsync(() => {
      givenPlanUsuario('AVANZADO');

      whenMontoYAvanzo();

      thenEsPremiumEs(true);
    }));

    it('dado plan BASICO, esPremium deberia ser false', fakeAsync(() => {
      givenPlanUsuario('BASICO');

      whenMontoYAvanzo();

      thenEsPremiumEs(false);
    }));

    it('dado plan INTERMEDIO, esPremium deberia ser true', fakeAsync(() => {
      givenPlanUsuario('INTERMEDIO');

      whenMontoYAvanzo();

      thenEsPremiumEs(true);
    }));

    it('dado plan INTERMEDIO, planActualLabel deberia ser Intermedio', fakeAsync(() => {
      givenPlanUsuario('INTERMEDIO');

      whenMontoYAvanzo();

      thenPlanActualLabelEs('Intermedio');
    }));

    it('dado perfil con fechaVencimientoPlan, vigenciaPlan deberia formatearla', fakeAsync(() => {
      givenPlanUsuario('INTERMEDIO');
      givenPerfilCargado(PerfilUsuarioMother.crear({
        fechaVencimientoPlan: '2026-08-05T22:48:39.49749',
      }));

      whenMontoYAvanzo();

      thenVigenciaPlanEs('05/08/2026');
    }));

    it('dado plan pago sin fechaVencimientoPlan, vigenciaPlan deberia mostrar Sin vencimiento', fakeAsync(() => {
      givenPlanUsuario('AVANZADO');
      givenPerfilCargado(PerfilUsuarioMother.crear({ fechaVencimientoPlan: null }));

      whenMontoYAvanzo();

      thenVigenciaPlanEs('Sin vencimiento');
    }));

    it('dado directivo con fechaVencimientoLicenciaColegio, deberia formatear la vigencia de licencia', fakeAsync(() => {
      givenUsuarioConRol('DIRECTIVO_COLEGIO');
      givenPerfilCargado(PerfilUsuarioMother.crear({
        role: 'DIRECTIVO_COLEGIO',
        estadoLicenciaColegio: 'ACTIVA',
        fechaVencimientoLicenciaColegio: '2026-08-05T22:48:39.49749',
      }));

      whenMontoYAvanzo();

      thenEstadoLicenciaColegioEs('Activa');
      thenVigenciaLicenciaColegioEs('05/08/2026');
    }));
  });

  function givenUsuarioLogueado(usuario: UsuarioLogueado): void {
    servicioPerfilUsuario.obtenerUsuarioLogueado.and.resolveTo(usuario);
  }

  function givenPerfilCargado(perfil: PerfilUsuario): void {
    servicioPerfilUsuario.obtenerPerfil.and.resolveTo(perfil);
  }

  function givenUsuarioConRol(rol: 'PADRE' | 'ALUMNO' | 'VENDEDOR' | 'DIRECTIVO_COLEGIO'): void {
    givenUsuarioLogueado(UsuarioLogueadoMother.crear({ role: rol }));
    givenPerfilCargado(PerfilUsuarioMother.crear({ role: rol }));
    if (rol === 'VENDEDOR') servicioPerfil.obtenerBuffetId.and.returnValue('buffet-1');
  }

  function givenPayoutExistente(config: PayoutConfig): void {
    servicioPayout.obtenerConfiguracion.and.resolveTo(config);
  }

  function givenSinConfigDePayout(): void {
    servicioPayout.obtenerConfiguracion.and.resolveTo(null as unknown as PayoutConfig);
  }

  function givenObtenerUsuarioLogueadoFalla(): void {
    servicioPerfilUsuario.obtenerUsuarioLogueado.and.rejectWith(new Error('boom'));
  }

  function givenActualizarPerfilResuelve(perfil: PerfilUsuario): void {
    servicioPerfilUsuario.actualizarPerfil.and.resolveTo(perfil);
  }

  function givenActualizarPerfilFalla(): void {
    servicioPerfilUsuario.actualizarPerfil.and.rejectWith(new Error('boom'));
  }

  function givenGuardarPayoutResuelve(response: unknown): void {
    servicioPayout.guardarConfiguracion.and.resolveTo(response as never);
  }

  function givenGuardarPayoutFalla(): void {
    servicioPayout.guardarConfiguracion.and.rejectWith(new Error('boom'));
  }

  function givenObtenerConfiguracionFalla(): void {
    servicioPayout.obtenerConfiguracion.and.rejectWith(new Error('boom'));
  }

  function givenSubirFotoResuelve(perfil: PerfilUsuario): void {
    servicioPerfilUsuario.subirFotoPerfil.and.resolveTo(perfil);
  }

  function givenSubirFotoFalla(): void {
    servicioPerfilUsuario.subirFotoPerfil.and.rejectWith(new Error('boom'));
  }

  function givenGuardandoEnCurso(): void {
    (component as unknown as { guardando: WritableSignalLike<boolean> }).guardando.set(true);
  }

  function givenCargandoEnCurso(): void {
    (component as unknown as { cargando: WritableSignalLike<boolean> }).cargando.set(true);
  }

  function givenGuardandoPayoutEnCurso(): void {
    (component as unknown as { guardandoPayout: WritableSignalLike<boolean> }).guardandoPayout.set(true);
  }

  function givenSinKiosqueroId(): void {
    servicioPerfil.obtenerBuffetId.and.returnValue(null);
    (component as unknown as { usuario: WritableSignalLike<unknown> }).usuario.set(null);
    (component as unknown as { perfil: WritableSignalLike<unknown> }).perfil.set(null);
    servicioPayout.guardarConfiguracion.calls.reset();
    servicioToast.mostrar.calls.reset();
  }

  function givenHomeUrl(url: string): void {
    homeUrlSignal.set(url);
  }

  function givenPerfilVacio(): void {
    (component as unknown as { perfil: WritableSignalLike<unknown> }).perfil.set(null);
  }

  function givenPlanUsuario(plan: string): void {
    servicioPerfil.perfil.and.returnValue({ plan } as never);
  }

  function givenEventoConArchivo(nombre: string, tipo: string, tamanio: number): Event {
    const blob = new Blob([new Uint8Array(tamanio)], { type: tipo });
    const file = new File([blob], nombre, { type: tipo });
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { value: [file], writable: false });
    return { target: input } as unknown as Event;
  }

  function givenEventoSinArchivo(): Event {
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: null, writable: false });
    return { target: input } as unknown as Event;
  }

  function givenFotoEventConInputSinArchivo(): void {
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: null, writable: false });
    (component as unknown as { fotoEvent: WritableSignalLike<Event | null> }).fotoEvent.set(
      { target: input } as unknown as Event,
    );
  }

  function resetGetConfiguracion(): void {
    servicioPayout.obtenerConfiguracion.calls.reset();
  }

  function whenMontoYAvanzo(): void {
    fixture.detectChanges();
    tick();
  }

  function whenMontoYAvanzoDosTicks(): void {
    fixture.detectChanges();
    tick();
    tick();
  }

  function whenSeteoCampos(valores: CamposForm): void {
    const controls = formControls();
    if (valores.firstName !== undefined) controls.firstName.setValue(valores.firstName);
    if (valores.lastName !== undefined) controls.lastName.setValue(valores.lastName);
    if (valores.phone !== undefined) controls.phone.setValue(valores.phone);
    if (valores.documentNumber !== undefined) controls.documentNumber.setValue(valores.documentNumber);
  }

  function whenMarcoTouched(campo: keyof ReturnType<typeof formControls>): void {
    formControls()[campo].markAsTouched();
  }

  function whenGuardoYAvanzo(): void {
    (component as unknown as { guardar: () => Promise<void> }).guardar();
    tick();
  }

  function whenDescarto(): void {
    (component as unknown as { descartarCambios: () => void }).descartarCambios();
  }

  function whenVuelvo(): void {
    (component as unknown as { volver: () => void }).volver();
  }

  function whenAbroSelectorFoto(): void {
    (component as unknown as { abrirSelectorFoto(): void }).abrirSelectorFoto();
  }

  function whenSeleccionoFoto(event: Event): void {
    (component as unknown as { onFotoSeleccionada: (e: Event) => Promise<void> }).onFotoSeleccionada(event);
    tick();
  }

  function whenRecortoFoto(blob: Blob): void {
    (component as unknown as { onFotoRecortada: (b: Blob) => Promise<void> }).onFotoRecortada(blob);
    tick();
  }

  function whenCanceloRecorte(): void {
    (component as unknown as { onCancelarRecorte: () => void }).onCancelarRecorte();
  }

  function whenGuardoPayoutYAvanzo(): void {
    (component as unknown as { guardarPayout: () => Promise<void> }).guardarPayout();
    tick();
  }

  function whenCompletoPayoutForm(): void {
    payoutForm().setValue({
      destinationCvu: '1'.repeat(22),
      destinationCuit: '2'.repeat(11),
      accountHolderName: 'Titular Test',
      cantidadIntervalo: 1,
      unidadIntervalo: 'DAYS',
      estado: 'ACTIVE',
    });
  }

  function whenDescartoCambiosPayout(): void {
    (component as unknown as { descartarCambiosPayout(): void }).descartarCambiosPayout();
    tick();
  }

  function whenLlamoCargarConfiguracionPayout(): void {
    (component as unknown as { cargarConfiguracionPayout(): Promise<void> }).cargarConfiguracionPayout();
    tick();
  }

  function whenSeteoPayoutFormControl(name: string, valor: string): void {
    payoutForm().controls[name].setValue(valor);
  }

  function whenMarcoTouchedPayout(name: string): void {
    payoutForm().controls[name].markAsTouched();
  }

  function spyOnClickDelInputFoto(): jasmine.Spy {
    const priv = component as unknown as { inputFoto: { nativeElement: HTMLInputElement } };
    return spyOn(priv.inputFoto.nativeElement, 'click');
  }

  function thenSeCargaronUsuarioYPerfil(): void {
    expect(servicioPerfilUsuario.obtenerUsuarioLogueado).toHaveBeenCalled();
    expect(servicioPerfilUsuario.obtenerPerfil).toHaveBeenCalled();
  }

  function thenSeSeteoNombreNavbar(nombre: string): void {
    expect(servicioUsuario.setNombreNavbar).toHaveBeenCalledWith(nombre);
  }

  function thenSeSeteoHomeUrl(url: string): void {
    expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith(url);
  }

  function thenSePidioLaConfigDeKiosquero(id: string): void {
    expect(servicioPayout.obtenerConfiguracion).toHaveBeenCalledWith(id);
  }

  function thenElErrorContiene(fragmento: string): void {
    expect(rawSignal('error')).toContain(fragmento);
  }

  function thenSeMostroToast(esperado: ToastEsperado): void {
    expect(servicioToast.mostrar).toHaveBeenCalledWith(esperado.matcher as never, esperado.tipo);
  }

  function thenNoSeActualizoElPerfil(): void {
    expect(servicioPerfilUsuario.actualizarPerfil).not.toHaveBeenCalled();
  }

  function thenSeActualizoElPerfilCon(cambios: CamposForm): void {
    expect(servicioPerfilUsuario.actualizarPerfil).toHaveBeenCalledWith(cambios);
  }

  function thenElCampoTieneValor(campo: keyof CamposForm, esperado: string): void {
    expect(formControls()[campo as keyof ReturnType<typeof formControls>].value).toBe(esperado);
  }

  function thenElFotoEventEs(esperado: Event | null): void {
    expect(rawSignal('fotoEvent')).toBe(esperado);
  }

  function thenSeSubioLaFoto(): void {
    expect(servicioPerfilUsuario.subirFotoPerfil).toHaveBeenCalled();
  }

  function thenNoSeSubioLaFoto(): void {
    expect(servicioPerfilUsuario.subirFotoPerfil).not.toHaveBeenCalled();
  }

  function thenSeNavegoA(url: string): void {
    expect(router.navigateByUrl).toHaveBeenCalledWith(url);
  }

  function thenRolLabelEs(rol: string | undefined, esperado: string): void {
    const priv = component as unknown as { rolLabel: (r: string | undefined) => string };
    expect(priv.rolLabel(rol)).toBe(esperado);
  }

  function thenCampoInvalidoEs(campo: 'firstName' | 'lastName' | 'phone' | 'documentNumber', esperado: boolean): void {
    const priv = component as unknown as { campoInvalido(k: typeof campo): boolean };
    expect(priv.campoInvalido(campo)).toBe(esperado);
  }

  function thenNombreCompletoEs(esperado: string): void {
    const priv = component as unknown as { nombreCompleto(): string };
    expect(priv.nombreCompleto()).toBe(esperado);
  }

  function thenInicialesSon(esperado: string): void {
    const priv = component as unknown as { iniciales(): string };
    expect(priv.iniciales()).toBe(esperado);
  }

  function thenNoSeGuardoElPayout(): void {
    expect(servicioPayout.guardarConfiguracion).not.toHaveBeenCalled();
  }

  function thenSeGuardoElPayout(): void {
    expect(servicioPayout.guardarConfiguracion).toHaveBeenCalled();
  }

  function thenSePidioLaConfigDePayout(): void {
    expect(servicioPayout.obtenerConfiguracion).toHaveBeenCalled();
  }

  function thenNoSePidioLaConfigDePayout(): void {
    expect(servicioPayout.obtenerConfiguracion).not.toHaveBeenCalled();
  }

  function thenCampoPayoutInvalidoEs(campo: string, esperado: boolean): void {
    const priv = component as unknown as { campoPayoutInvalido(k: string): boolean };
    expect(priv.campoPayoutInvalido(campo)).toBe(esperado);
  }

  function thenElPayoutFormEs(esperado: PayoutFormValor): void {
    const valor = payoutForm().value;
    expect(valor.destinationCvu).toBe(esperado.destinationCvu);
    expect(valor.destinationCuit).toBe(esperado.destinationCuit);
    expect(valor.accountHolderName).toBe(esperado.accountHolderName);
    expect(valor.cantidadIntervalo).toBe(esperado.cantidadIntervalo);
    expect(valor.unidadIntervalo).toBe(esperado.unidadIntervalo);
    expect(valor.estado).toBe(esperado.estado);
  }

  function thenLaProximaEjecucionEs(esperado: string | null): void {
    const priv = component as unknown as { proximaEjecucion(): string | null };
    expect(priv.proximaEjecucion()).toBe(esperado);
  }

  function thenTienePayoutExistenteEs(esperado: boolean): void {
    const priv = component as unknown as { tienePayoutExistente(): boolean };
    expect(priv.tienePayoutExistente()).toBe(esperado);
  }

  function thenEsPremiumEs(esperado: boolean): void {
    const priv = component as unknown as { esPremium(): boolean };
    expect(priv.esPremium()).toBe(esperado);
  }

  function thenPlanActualLabelEs(esperado: string): void {
    const priv = component as unknown as { planActualLabel(): string };
    expect(priv.planActualLabel()).toBe(esperado);
  }

  function thenVigenciaPlanEs(esperado: string): void {
    const priv = component as unknown as { vigenciaPlan(): string };
    expect(priv.vigenciaPlan()).toBe(esperado);
  }

  function thenEstadoLicenciaColegioEs(esperado: string): void {
    const priv = component as unknown as { estadoLicenciaColegio(): string };
    expect(priv.estadoLicenciaColegio()).toBe(esperado);
  }

  function thenVigenciaLicenciaColegioEs(esperado: string): void {
    const priv = component as unknown as { vigenciaLicenciaColegio(): string };
    expect(priv.vigenciaLicenciaColegio()).toBe(esperado);
  }

  function formControls(): {
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    phone: FormControl<string>;
    documentNumber: FormControl<string>;
  } {
    const form = (component as unknown as { form: FormGroup }).form;
    return form.controls as never;
  }

  function payoutForm(): FormGroup {
    return (component as unknown as { payoutForm: FormGroup }).payoutForm;
  }

  function rawSignal(name: string): unknown {
    return (component as unknown as Record<string, () => unknown>)[name]();
  }
});
