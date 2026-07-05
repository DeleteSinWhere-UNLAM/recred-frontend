import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DirectivoPage } from './directivo.page';
import { DirectivoPresenter } from './presenter/directivo.presenter';
import { PerfilService } from '../../data-access/services/perfil.service';
import { DirectivoService } from './services/directivo.service';
import { DirectivoMother } from './directivo.mother';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStubComponent {}

describe('DirectivoPage (Integración: UI + Presenter)', () => {
  let fixture: ComponentFixture<DirectivoPage>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let directivoServiceSpy: jasmine.SpyObj<DirectivoService>;

  beforeEach(async () => {
    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['cargarPerfil']);
    directivoServiceSpy = jasmine.createSpyObj('DirectivoService', ['obtenerResumenColegio']);

    await TestBed.configureTestingModule({
      imports: [DirectivoPage, RouterTestingModule],
      providers: [
        DirectivoPresenter,
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: DirectivoService, useValue: directivoServiceSpy },
      ],
    })
    .overrideComponent(DirectivoPage, {
      remove: {
        imports: [NavbarComponent]
      },
      add: {
        imports: [NavbarStubComponent]
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
      
      fixture.detectChanges(); // Triggers ngOnInit
      await new Promise(resolve => setTimeout(resolve, 50));
      fixture.detectChanges(); // Update DOM after promises resolve

      const dashboardElement = fixture.nativeElement.querySelector('app-directivo-dashboard');
      console.log('DASHBOARD HTML:', dashboardElement?.innerHTML);
      expect(dashboardElement).toBeTruthy();
      
      const headerTitle = fixture.debugElement.query(By.css('#pv-title'));
      expect(headerTitle).toBeTruthy('headerTitle should exist');
      expect(headerTitle.nativeElement.textContent).toContain('Colegio Integracion');
    });
  });

  describe('Flujo de Error', () => {
    it('debería mostrar mensaje de acceso denegado si retorna 403', async () => {
      perfilServiceSpy.cargarPerfil.and.resolveTo(DirectivoMother.perfilDirectivo({ nombre: 'Carlos' }));
      directivoServiceSpy.obtenerResumenColegio.and.rejectWith(new HttpErrorResponse({ status: 403 }));

      fixture = TestBed.createComponent(DirectivoPage);
      fixture.detectChanges(); // Triggers ngOnInit
      await new Promise(resolve => setTimeout(resolve, 50));
      fixture.detectChanges(); // Update DOM after promises resolve

      const errorAlert = fixture.debugElement.query(By.css('.pv__notice--error'));
      expect(errorAlert).toBeTruthy();
      expect(errorAlert.nativeElement.textContent).toContain('No tienes permisos');
    });
  });
});
