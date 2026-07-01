import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PreferenciasDetectadasPresenter } from './preferencias-detectadas.presenter';
import { PreferenciasDetectadasService } from '../services/preferencias-detectadas.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { PreferenciaDetectada } from '../models/preferencia-detectada.model';
import { PreferenciasDetectadasMother } from '../preferencias-detectadas.mother';

describe('PreferenciasDetectadasPresenter', () => {
  let presenter: PreferenciasDetectadasPresenter;
  let preferenciasServiceSpy: jasmine.SpyObj<PreferenciasDetectadasService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;

  beforeEach(() => {
    preferenciasServiceSpy = jasmine.createSpyObj('PreferenciasDetectadasService', ['getPreferencias']);
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual']);

    TestBed.configureTestingModule({
      providers: [
        PreferenciasDetectadasPresenter,
        { provide: PreferenciasDetectadasService, useValue: preferenciasServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy }
      ]
    });

    presenter = TestBed.inject(PreferenciasDetectadasPresenter);
  });

  describe('Inicialización', () => {
    it('debería emitir un error si no hay usuario en sesión', () => {
      usuarioServiceSpy.getUsuarioActual.and.returnValue(null as unknown as ReturnType<UsuarioService['getUsuarioActual']>);
      let errorEmitido: string | null | undefined;
      presenter.error$.subscribe(val => errorEmitido = val);

      presenter.initialize();

      expect(errorEmitido).toBe('Usuario no autenticado.');
      expect(preferenciasServiceSpy.getPreferencias).not.toHaveBeenCalled();
    });

    it('debería solicitar las preferencias al servicio y actualizar el estado cuando sea exitoso', () => {
      const usuario = PreferenciasDetectadasMother.crearUsuario();
      usuarioServiceSpy.getUsuarioActual.and.returnValue(usuario);
      const preferenciasEsperadas = [
        PreferenciasDetectadasMother.crearPreferencia(),
        PreferenciasDetectadasMother.crearPreferencia({ titulo: 'Preferencia 2' })
      ];
      preferenciasServiceSpy.getPreferencias.and.returnValue(of(preferenciasEsperadas));
      let preferenciasEmitidas: PreferenciaDetectada[] = [];
      let isLoadingEmitido = true;
      let errorEmitido: string | null | undefined;
      presenter.preferencias$.subscribe(val => preferenciasEmitidas = val);
      presenter.isLoading$.subscribe(val => isLoadingEmitido = val);
      presenter.error$.subscribe(val => errorEmitido = val);

      presenter.initialize();

      expect(preferenciasServiceSpy.getPreferencias).toHaveBeenCalledWith(usuario.id);
      expect(preferenciasEmitidas).toEqual(preferenciasEsperadas);
      expect(isLoadingEmitido).toBeFalse();
      expect(errorEmitido).toBeNull();
    });

    it('debería actualizar el estado de error cuando el servicio falle', () => {
      const usuario = PreferenciasDetectadasMother.crearUsuario();
      usuarioServiceSpy.getUsuarioActual.and.returnValue(usuario);
      preferenciasServiceSpy.getPreferencias.and.returnValue(throwError(() => new Error('Error de red')));
      let preferenciasEmitidas: PreferenciaDetectada[] | undefined;
      let errorEmitido: string | null | undefined;
      let isLoadingEmitido = true;
      presenter.preferencias$.subscribe(val => preferenciasEmitidas = val);
      presenter.error$.subscribe(val => errorEmitido = val);
      presenter.isLoading$.subscribe(val => isLoadingEmitido = val);

      presenter.initialize();

      expect(preferenciasEmitidas).toEqual([]);
      expect(errorEmitido).toBe('Error al cargar las preferencias detectadas.');
      expect(isLoadingEmitido).toBeFalse();
    });
  });
});
