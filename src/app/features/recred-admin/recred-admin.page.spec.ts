import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecredAdminPresenter } from './presenter/recred-admin.presenter';
import { RecredAdminPage } from './recred-admin.page';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
class MockNavbarComponent {}

describe('RecredAdminPage', () => {
  let component: RecredAdminPage;
  let fixture: ComponentFixture<RecredAdminPage>;
  let presenterSpy: jasmine.SpyObj<RecredAdminPresenter>;

  beforeEach(async () => {
    presenterSpy = jasmine.createSpyObj<RecredAdminPresenter>(
      'RecredAdminPresenter',
      ['initialize', 'aprobar', 'rechazar'],
      {
        solicitudes$: { subscribe: () => ({ unsubscribe: () => undefined }) } as never,
        cargando$: { subscribe: () => ({ unsubscribe: () => undefined }) } as never,
        error$: { subscribe: () => ({ unsubscribe: () => undefined }) } as never,
      },
    );
    await TestBed.configureTestingModule({
      imports: [RecredAdminPage],
    })
      .overrideComponent(RecredAdminPage, {
        remove: { imports: [NavbarComponent] },
        add: {
          imports: [MockNavbarComponent],
          providers: [
            { provide: RecredAdminPresenter, useValue: presenterSpy },
          ],
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(RecredAdminPage);
    component = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('dado la page, cuando se monta, deberia inicializar el presenter', () => {
      whenSeMontaLaPage();

      thenSeInicializoElPresenter();
    });
  });

  function whenSeMontaLaPage(): void {
    component.ngOnInit();
  }

  function thenSeInicializoElPresenter(): void {
    expect(presenterSpy.initialize).toHaveBeenCalled();
  }
});
