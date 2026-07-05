import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectivoPage } from './directivo.page';
import { DirectivoPresenter } from './presenter/directivo.presenter';
import { PerfilService } from '../../data-access/services/perfil.service';
import { DirectivoService } from './services/directivo.service';
import { DirectivoMother } from './directivo.mother';
import { AuthService } from '../../core/auth/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';

describe('DirectivoPage (Integración: UI + Presenter)', () => {
  let fixture: ComponentFixture<DirectivoPage>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let directivoServiceSpy: jasmine.SpyObj<DirectivoService>;

  beforeEach(async () => {
    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['cargarPerfil']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    directivoServiceSpy = jasmine.createSpyObj('DirectivoService', ['obtenerResumenColegio']);

    await TestBed.configureTestingModule({
      imports: [DirectivoPage],
      providers: [
        DirectivoPresenter,
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: DirectivoService, useValue: directivoServiceSpy },
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
      directivoServiceSpy.obtenerResumenColegio.and.resolveTo({
        id: '123',
        nombre: 'Colegio Integracion',
        cue: '444',
        buffets: []
      });

      fixture = TestBed.createComponent(DirectivoPage);
      
      fixture.componentInstance.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      const h1Element = fixture.nativeElement.querySelector('h1');
      expect(h1Element.textContent.trim()).toBe('Hola bienvenido, Carlos');
      
      const dashboardElement = fixture.nativeElement.querySelector('app-directivo-dashboard');
      expect(dashboardElement).toBeTruthy();
      
      const header2 = fixture.debugElement.query(By.css('app-directivo-dashboard h2'));
      expect(header2.nativeElement.textContent).toContain('Colegio Integracion');
    });
  });

  describe('Flujo de Error', () => {
    it('debería mostrar mensaje de acceso denegado si retorna 403', async () => {
      perfilServiceSpy.cargarPerfil.and.resolveTo(DirectivoMother.perfilDirectivo({ nombre: 'Carlos' }));
      directivoServiceSpy.obtenerResumenColegio.and.rejectWith(new HttpErrorResponse({ status: 403 }));

      fixture = TestBed.createComponent(DirectivoPage);
      fixture.componentInstance.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      const errorAlert = fixture.debugElement.query(By.css('.error-alert'));
      expect(errorAlert).toBeTruthy();
      expect(errorAlert.nativeElement.textContent).toContain('No tienes permisos');
    });
  });
});
