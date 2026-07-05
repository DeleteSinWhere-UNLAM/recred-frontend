import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectivoPage } from './directivo.page';
import { DirectivoPresenter } from './presenter/directivo.presenter';
import { PerfilService } from '../../data-access/services/perfil.service';
import { DirectivoMother } from './directivo.mother';
import { AuthService } from '../../core/auth/services/auth.service';

describe('DirectivoPage (Integración: UI + Presenter)', () => {
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

  describe('Flujo Principal (Happy Path)', () => {
    it('debería renderizar la UI completa consumiendo el presenter real y los datos del servicio', async () => {
      
      const perfilFake = DirectivoMother.perfilDirectivo({ nombre: 'Carlos' });
      perfilServiceSpy.cargarPerfil.and.resolveTo(perfilFake);

      fixture = TestBed.createComponent(DirectivoPage);
      
      
      
      
      fixture.componentInstance.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      
      const h1Element = fixture.nativeElement.querySelector('h1');
      expect(h1Element.textContent.trim()).toBe('Hola bienvenido, Carlos');
      
      const dashboardElement = fixture.nativeElement.querySelector('app-directivo-dashboard');
      expect(dashboardElement).toBeTruthy();
    });
  });
});
