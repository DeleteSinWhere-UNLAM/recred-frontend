import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navigation, Router } from '@angular/router';
import { CrearBuffetPage } from './crear-buffet.page';
import { CrearBuffetFormComponent } from './components/crear-buffet-form/crear-buffet-form.component';
import { CrearBuffetPresenter } from './presenter/crear-buffet.presenter';
import { CrearBuffetRequest } from '../models/directivo.model';

@Component({
  selector: 'app-crear-buffet-form',
  template: '',
  standalone: true,
})
class CrearBuffetFormStub {
  @Input() loading = false;
  @Input() error: string | null = null;
  @Output() submitForm = new EventEmitter<CrearBuffetRequest>();
  @Output() cancelForm = new EventEmitter<void>();
}

interface PresenterMock {
  loading: ReturnType<typeof signal<boolean>>;
  error: ReturnType<typeof signal<string | null>>;
  crear: jasmine.Spy;
  cancelar: jasmine.Spy;
}

describe('CrearBuffetPage', () => {
  let component: CrearBuffetPage;
  let fixture: ComponentFixture<CrearBuffetPage>;
  let router: jasmine.SpyObj<Router>;
  let presenter: PresenterMock;

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['getCurrentNavigation', 'navigate']);
    router.getCurrentNavigation.and.returnValue(null);
    presenter = {
      loading: signal(false),
      error: signal<string | null>(null),
      crear: jasmine.createSpy('crear'),
      cancelar: jasmine.createSpy('cancelar'),
    };

    await TestBed.configureTestingModule({
      imports: [CrearBuffetPage],
      providers: [{ provide: Router, useValue: router }],
    })
      .overrideComponent(CrearBuffetPage, {
        remove: {
          imports: [CrearBuffetFormComponent],
          providers: [CrearBuffetPresenter],
        },
        add: {
          imports: [CrearBuffetFormStub],
          providers: [{ provide: CrearBuffetPresenter, useValue: presenter }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CrearBuffetPage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    history.replaceState({}, '', location.href);
  });

  describe('ngOnInit', () => {
    it('dado un state en getCurrentNavigation con schoolId, deberia tomarlo', () => {
      router.getCurrentNavigation.and.returnValue({
        extras: { state: { schoolId: 'school-nav' } },
      } as unknown as Navigation);

      whenMonto();

      expect(component.schoolId).toBe('school-nav');
    });

    it('dado un state en history con schoolId, deberia tomarlo', () => {
      history.replaceState({ schoolId: 'school-hist' }, '', location.href);

      whenMonto();

      expect(component.schoolId).toBe('school-hist');
    });

    it('dado que no hay ningun state, deberia navegar al dashboard directivo', () => {
      spyOn(console, 'warn');
      history.replaceState({}, '', location.href);

      whenMonto();

      expect(router.navigate).toHaveBeenCalledWith(['/directivo']);
      expect(component.schoolId).toBeNull();
    });
  });

  describe('onSubmit', () => {
    it('dado un schoolId cargado, cuando envio el formulario, deberia delegar al presenter con esos datos', () => {
      component.schoolId = 'school-1';
      const data: CrearBuffetRequest = {
        name: 'Buffet Test',
        habilitationExpirationDate: '2027-12-31',
      };

      component.onSubmit(data);

      expect(presenter.crear).toHaveBeenCalledWith('school-1', data);
    });

    it('dado sin schoolId, cuando envio el formulario, no deberia llamar al presenter', () => {
      component.schoolId = null;

      component.onSubmit({} as CrearBuffetRequest);

      expect(presenter.crear).not.toHaveBeenCalled();
    });
  });

  describe('render', () => {
    it('deberia mostrar el titulo "Registrar Nuevo Buffet/Kiosco"', () => {
      history.replaceState({ schoolId: 's1' }, '', location.href);

      whenMonto();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain(
        'Registrar Nuevo Buffet/Kiosco',
      );
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
