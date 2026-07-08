import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../../core/auth/services/auth.service';
import { LandingPresenter } from './landing.presenter';
import { CtaLandingMother } from '../landing.mother';

describe('LandingPresenter', () => {
  let presenter: LandingPresenter;
  let servicioAuth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    servicioAuth = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    servicioAuth.login.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        LandingPresenter,
        { provide: AuthService, useValue: servicioAuth },
      ],
    });

    presenter = TestBed.inject(LandingPresenter);
  });

  it('dado que se inyecta el presenter, deberia crearse correctamente', () => {
    expect(presenter).toBeTruthy();
  });

  it('dado el presenter recien creado, cuando leo las ctas, deberia exponer la primaria de login y la secundaria de registro', () => {
    whenLeoLasCtas();

    thenLasCtasSon(CtaLandingMother.crearPrimario(), CtaLandingMother.crearSecundario());
  });

  it('dado el presenter recien creado, cuando inicio el login, deberia delegar al AuthService', async () => {
    await whenInicioLogin();

    thenSeLlamoAuthLoginVecesIgualA(1);
  });

  it('dado que el AuthService falla, cuando inicio el login, deberia propagar el error', async () => {
    givenQueElAuthServiceFalla('login fallido');

    await thenInicioLoginRechazaCon('login fallido');
  });

  it('dado ningun override, cuando llamo a CtaLandingMother.crear, deberia devolver el cta primario por defecto', () => {
    expect(CtaLandingMother.crear()).toEqual(CtaLandingMother.crearPrimario());
  });

  it('dado la lista mother, deberia devolver las dos ctas en el mismo orden que el presenter', () => {
    expect(CtaLandingMother.crearLista()).toEqual([
      CtaLandingMother.crearPrimario(),
      CtaLandingMother.crearSecundario(),
    ]);
  });

  function givenQueElAuthServiceFalla(mensaje: string): void {
    servicioAuth.login.and.rejectWith(new Error(mensaje));
  }

  function whenLeoLasCtas() {
    return presenter.ctas;
  }

  function whenInicioLogin(): Promise<void> {
    return presenter.iniciarLogin();
  }

  function thenLasCtasSon(...esperadas: ReturnType<typeof CtaLandingMother.crearPrimario>[]): void {
    const ctas = presenter.ctas;
    expect(ctas.length).toBe(esperadas.length);
    esperadas.forEach((esperada, i) => expect(ctas[i]).toEqual(esperada));
  }

  function thenSeLlamoAuthLoginVecesIgualA(cantidad: number): void {
    expect(servicioAuth.login).toHaveBeenCalledTimes(cantidad);
  }

  async function thenInicioLoginRechazaCon(mensaje: string): Promise<void> {
    await expectAsync(presenter.iniciarLogin()).toBeRejectedWithError(mensaje);
  }
});
