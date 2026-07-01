import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HijoData, HijoResumenGrafico, ResumenSemanalPresenter } from './resumen-semanal.presenter';
import { ResumenSemanalService } from '../services/resumen-semanal.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { MensajeHijo, ResumenSemanal } from '../models/resumen-semanal.model';
import { ResumenSemanalMother } from '../resumen-semanal.mother';

describe('ResumenSemanalPresenter', () => {
  let presenter: ResumenSemanalPresenter;
  let resumenServiceSpy: jasmine.SpyObj<ResumenSemanalService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;

  beforeEach(() => {
    resumenServiceSpy = jasmine.createSpyObj('ResumenSemanalService', ['getResumen']);
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual']);

    TestBed.configureTestingModule({
      providers: [
        ResumenSemanalPresenter,
        { provide: ResumenSemanalService, useValue: resumenServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy }
      ]
    });

    presenter = TestBed.inject(ResumenSemanalPresenter);
  });

  describe('Inicialización', () => {
    it('debería emitir un error si no hay usuario en sesión', () => {
      usuarioServiceSpy.getUsuarioActual.and.returnValue(null as unknown as ReturnType<UsuarioService['getUsuarioActual']>);
      let errorEmitido: string | null | undefined;
      presenter.error$.subscribe(val => errorEmitido = val);

      presenter.initialize();

      expect(errorEmitido).toBe('Usuario no autenticado.');
      expect(resumenServiceSpy.getResumen).not.toHaveBeenCalled();
    });

    it('debería procesar los datos, separar nombres, calcular totales y actualizar estados al cargar el resumen', () => {
      const usuario = ResumenSemanalMother.crearUsuario();
      usuarioServiceSpy.getUsuarioActual.and.returnValue(usuario);
      const resumenEsperado = ResumenSemanalMother.crearResumen();
      resumenServiceSpy.getResumen.and.returnValue(of(resumenEsperado));
      let resumenEmitido: ResumenSemanal | undefined;
      let hijosEmitidos: HijoData[] = [];
      let hijosResumenEmitidos: HijoResumenGrafico[] = [];
      let mensajesEmitidos: MensajeHijo[] = [];
      let totalEmitido = 0;
      let isLoadingEmitido = true;
      let errorEmitido: string | null | undefined;
      presenter.resumen$.subscribe(val => resumenEmitido = val ?? undefined);
      presenter.hijos$.subscribe(val => hijosEmitidos = val);
      presenter.hijosResumen$.subscribe(val => hijosResumenEmitidos = val);
      presenter.mensajes$.subscribe(val => mensajesEmitidos = val);
      presenter.totalFamiliar$.subscribe(val => totalEmitido = val);
      presenter.isLoading$.subscribe(val => isLoadingEmitido = val);
      presenter.error$.subscribe(val => errorEmitido = val);

      presenter.initialize();

      expect(resumenServiceSpy.getResumen).toHaveBeenCalled();
      expect(resumenEmitido as ResumenSemanal).toEqual(resumenEsperado);
      expect(hijosEmitidos.length).toBe(2);
      expect(hijosEmitidos[0].nombre).toBe('Juan');
      expect(hijosEmitidos[1].nombre).toBe('Maria');
      expect(hijosResumenEmitidos.length).toBe(2);
      expect(hijosResumenEmitidos[0].nombre).toBe('Juan');
      expect(hijosResumenEmitidos[0].porcentaje).toBeCloseTo(66.66, 1);
      expect(mensajesEmitidos.length).toBe(1);
      expect(mensajesEmitidos[0].nombre).toBe('Juan');
      expect(totalEmitido).toBe(1500); // 1000 de Juan + 500 de Maria
      expect(isLoadingEmitido).toBeFalse();
      expect(errorEmitido).toBeNull();
    });

    it('debería actualizar el estado de error cuando el servicio falle o el parseo devuelva error', () => {
      const usuario = ResumenSemanalMother.crearUsuario();
      usuarioServiceSpy.getUsuarioActual.and.returnValue(usuario);
      resumenServiceSpy.getResumen.and.returnValue(throwError(() => new Error('Error de red')));
      let errorEmitido: string | null | undefined;
      let isLoadingEmitido = true;
      presenter.error$.subscribe(val => errorEmitido = val);
      presenter.isLoading$.subscribe(val => isLoadingEmitido = val);

      presenter.initialize();

      expect(errorEmitido).toBe('Error al cargar el resumen semanal.');
      expect(isLoadingEmitido).toBeFalse();
    });
  });

  describe('getCategorias', () => {
    it('debería retornar un arreglo de tuplas de categorías', () => {
      const hijo = ResumenSemanalMother.crearHijoResumen({ porCategoria: { Snacks: 60, Bebidas: 40 } });

      const resultado = presenter.getCategorias(hijo);

      expect(resultado).toEqual([['Snacks', 60], ['Bebidas', 40]]);
    });

    it('debería retornar un arreglo vacío si el hijo no tiene categorías', () => {
      const hijo = ResumenSemanalMother.crearHijoResumen({ porCategoria: undefined });

      const resultado = presenter.getCategorias(hijo);

      expect(resultado).toEqual([]);
    });
  });
});
