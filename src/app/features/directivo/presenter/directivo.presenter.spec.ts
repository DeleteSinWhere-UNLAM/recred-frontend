import { DirectivoPresenter } from './directivo.presenter';
import { DirectivoMother } from '../directivo.mother';
import { TestBed } from '@angular/core/testing';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { DirectivoService } from '../services/directivo.service';
import { Perfil } from '../../../data-access/models/perfil.model';
import { SubscriptionPaymentService } from '../../../data-access/services/suscripciones/subscription-payment.service';
import { ToastService } from '../../../shared/services/toast.service';

describe('DirectivoPresenter', () => {
  let presenter: DirectivoPresenter;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let directivoServiceSpy: jasmine.SpyObj<DirectivoService>;
  let subscriptionPaymentServiceSpy: jasmine.SpyObj<SubscriptionPaymentService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['cargarPerfil']);
    directivoServiceSpy = jasmine.createSpyObj('DirectivoService', ['obtenerResumenColegio']);
    subscriptionPaymentServiceSpy = jasmine.createSpyObj<SubscriptionPaymentService>('SubscriptionPaymentService', [
      'crearPagoSuscripcionColegio',
    ]);
    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    directivoServiceSpy.obtenerResumenColegio.and.resolveTo({
      id: 'colegio-1',
      nombre: 'Colegio Prueba',
      cue: '123',
      buffets: []
    });

    TestBed.configureTestingModule({
      providers: [
        DirectivoPresenter,
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: DirectivoService, useValue: directivoServiceSpy },
        { provide: SubscriptionPaymentService, useValue: subscriptionPaymentServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ],
    });

    presenter = TestBed.inject(DirectivoPresenter);
    givenPagoLicenciaResuelve();
  });

  describe('Al inicializar el presenter', () => {
    it('dado un directivo con nombre "Juan", cuando inicializo, deberia exponer el mensaje de bienvenida personalizado', async () => {
      givenPerfilDelDirectivo(DirectivoMother.perfilDirectivo({ nombre: 'Juan' }));

      await presenter.inicializar();

      expect(presenter.mensajeBienvenida()).toBe('Hola bienvenido, Juan');
    });

    it('dado que la carga del perfil falla, cuando inicializo, deberia exponer un mensaje por defecto', async () => {
      givenLaCargaDelPerfilFalla();

      await presenter.inicializar();

      expect(presenter.mensajeBienvenida()).toBe('Hola bienvenido');
    });
  });

  describe('pago de licencia', () => {
    it('dado un colegio cargado, cuando paga licencia, deberia crear el pago y redirigir al checkout', async () => {
      givenPerfilDelDirectivo(DirectivoMother.perfilDirectivo({ nombre: 'Juan' }));
      const redireccion = givenRedireccionInterceptada();
      await presenter.inicializar();

      await presenter.pagarLicenciaColegio();

      expect(subscriptionPaymentServiceSpy.crearPagoSuscripcionColegio).toHaveBeenCalledWith({
        colegioId: 'colegio-1',
      });
      expect(redireccion).toHaveBeenCalledWith('https://www.mercadopago.com/school-checkout');
      expect(presenter.pagandoLicencia()).toBeFalse();
    });

    it('dado que el pago falla, cuando paga licencia, deberia mostrar error', async () => {
      spyOn(console, 'error');
      givenPerfilDelDirectivo(DirectivoMother.perfilDirectivo({ nombre: 'Juan' }));
      subscriptionPaymentServiceSpy.crearPagoSuscripcionColegio.and.rejectWith(new Error('boom'));
      await presenter.inicializar();

      await presenter.pagarLicenciaColegio();

      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('No pudimos iniciar el pago de la licencia.', 'error');
      expect(presenter.errorPagoLicencia()).toBe('No pudimos iniciar el pago de la licencia.');
    });
  });

  function givenPerfilDelDirectivo(perfil: Perfil): void {
    perfilServiceSpy.cargarPerfil.and.resolveTo(perfil);
  }

  function givenLaCargaDelPerfilFalla(): void {
    perfilServiceSpy.cargarPerfil.and.rejectWith(new Error('Network error'));
  }

  function givenPagoLicenciaResuelve(): void {
    subscriptionPaymentServiceSpy.crearPagoSuscripcionColegio.and.resolveTo({
      paymentId: 'pago-1',
      preferenceId: 'pref-1',
      checkoutUrl: 'https://www.mercadopago.com/school-checkout',
      estado: 'PENDIENTE',
      monto: 20,
    });
  }

  function givenRedireccionInterceptada(): jasmine.Spy {
    const priv = presenter as unknown as { redirigirAPago(url: string): void };
    return spyOn(priv, 'redirigirAPago').and.stub();
  }
});
