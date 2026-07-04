import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectivoPage } from './directivo.page';
import { DirectivoPresenter } from './presenter/directivo.presenter';
import { PerfilService } from '../../data-access/services/perfil.service';
import { DirectivoMother } from './directivo.mother';
import { AuthService } from '../../core/auth/services/auth.service';

describe('DirectivoPage Integration', () => {
  let fixture: ComponentFixture<DirectivoPage>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['cargarPerfil']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [DirectivoPage],
      providers: [
        DirectivoPresenter,
        { provide: PerfilService, useValue: perfilServiceSpy },
      ],
    })
    .overrideComponent(DirectivoPage, {
      set: {
        providers: [
          DirectivoPresenter,
          { provide: AuthService, useValue: authServiceSpy }
        ]
      }
    })
    .compileComponents();
  });

  it('debería renderizar la UI completa consumiendo el presenter real y los datos del servicio', async () => {
    const perfilFake = DirectivoMother.perfilDirectivo({ nombre: 'Carlos' });
    
    givenPerfilDirectivo(perfilFake);
    await whenInicializoComponente();
    thenSeMuestraBienvenidaYDahsboard();
  });

  function givenPerfilDirectivo(perfil: any): void {
    perfilServiceSpy.cargarPerfil.and.resolveTo(perfil);
  }

  async function whenInicializoComponente(): Promise<void> {
    fixture = TestBed.createComponent(DirectivoPage);
    fixture.componentInstance.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function thenSeMuestraBienvenidaYDahsboard(): void {
    const h1Element = fixture.nativeElement.querySelector('h1');
    expect(h1Element.textContent.trim()).toBe('Hola bienvenido, Carlos');
    
    const dashboardElement = fixture.nativeElement.querySelector('app-directivo-dashboard');
    expect(dashboardElement).toBeTruthy();
  }
});
