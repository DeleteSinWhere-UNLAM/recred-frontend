import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectivoPage } from './directivo.page';
import { DirectivoPresenter } from './presenter/directivo.presenter';
import { Component, Input, signal } from '@angular/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { DirectivoDashboardComponent } from './components/directivo-dashboard/directivo-dashboard.component';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStubComponent { }

@Component({ selector: 'app-directivo-dashboard', template: '', standalone: true })
class DashboardStubComponent {
  @Input() data: unknown;
  @Input() loading: unknown;
  @Input() error: unknown;
}

describe('DirectivoPage', () => {
  let component: DirectivoPage;
  let fixture: ComponentFixture<DirectivoPage>;
  let presenterSpy: jasmine.SpyObj<DirectivoPresenter>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {

    presenterSpy = jasmine.createSpyObj('DirectivoPresenter', ['inicializar'], {
      mensajeBienvenida: signal('Cargando...'),
      schoolOverview: signal(null),
      loading: signal(false),
      error: signal(null)
    });
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [DirectivoPage],
    })
      .overrideComponent(DirectivoPage, {
        remove: {
          imports: [NavbarComponent, DirectivoDashboardComponent],
          providers: [DirectivoPresenter]
        },
        add: {
          imports: [NavbarStubComponent, DashboardStubComponent],
          providers: [
            { provide: DirectivoPresenter, useValue: presenterSpy },
            { provide: AuthService, useValue: authServiceSpy }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(DirectivoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado el componente montado, cuando corre ngOnInit, deberia inicializar el presenter', () => {
    component.ngOnInit();
    expect(presenterSpy.inicializar).toHaveBeenCalled();
  });


});
