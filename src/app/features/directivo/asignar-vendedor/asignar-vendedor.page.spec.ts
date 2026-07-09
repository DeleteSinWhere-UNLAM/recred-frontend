import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navigation, Router } from '@angular/router';
import { AsignarVendedorPage } from './asignar-vendedor.page';
import { AsignarVendedorFormComponent } from './components/asignar-vendedor-form/asignar-vendedor-form.component';
import { AsignarVendedorPresenter } from './presenter/asignar-vendedor.presenter';
import { CrearVendedorRequest } from '../models/directivo.model';

@Component({
  selector: 'app-asignar-vendedor-form',
  template: '',
  standalone: true,
})
class AsignarVendedorFormStub {
  @Input() loading = false;
  @Input() error: string | null = null;
  @Output() submitForm = new EventEmitter<CrearVendedorRequest>();
  @Output() cancelForm = new EventEmitter<void>();
}

interface PresenterMock {
  loading: ReturnType<typeof signal<boolean>>;
  error: ReturnType<typeof signal<string | null>>;
  asignar: jasmine.Spy;
  cancelar: jasmine.Spy;
}

describe('AsignarVendedorPage', () => {
  let component: AsignarVendedorPage;
  let fixture: ComponentFixture<AsignarVendedorPage>;
  let router: jasmine.SpyObj<Router>;
  let presenter: PresenterMock;

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['getCurrentNavigation', 'navigate']);
    router.getCurrentNavigation.and.returnValue(null);
    presenter = {
      loading: signal(false),
      error: signal<string | null>(null),
      asignar: jasmine.createSpy('asignar'),
      cancelar: jasmine.createSpy('cancelar'),
    };

    await TestBed.configureTestingModule({
      imports: [AsignarVendedorPage],
      providers: [{ provide: Router, useValue: router }],
    })
      .overrideComponent(AsignarVendedorPage, {
        remove: {
          imports: [AsignarVendedorFormComponent],
          providers: [AsignarVendedorPresenter],
        },
        add: {
          imports: [AsignarVendedorFormStub],
          providers: [{ provide: AsignarVendedorPresenter, useValue: presenter }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AsignarVendedorPage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    history.replaceState({}, '', location.href);
  });

  describe('ngOnInit', () => {
    it('dado un state en getCurrentNavigation, deberia tomar buffetId y buffetName de ahi', () => {
      router.getCurrentNavigation.and.returnValue({
        extras: { state: { buffetId: 'buffet-nav', buffetName: 'Buffet desde nav' } },
      } as unknown as Navigation);

      whenMonto();

      expect(component.buffetId).toBe('buffet-nav');
      expect(component.buffetName).toBe('Buffet desde nav');
    });

    it('dado un state en history.state, deberia tomar los datos de ahi', () => {
      history.replaceState({ buffetId: 'buffet-hist', buffetName: 'Desde history' }, '', location.href);

      whenMonto();

      expect(component.buffetId).toBe('buffet-hist');
      expect(component.buffetName).toBe('Desde history');
    });

    it('dado un state en history sin buffetName, deberia dejar el nombre como string vacio', () => {
      history.replaceState({ buffetId: 'buffet-hist' }, '', location.href);

      whenMonto();

      expect(component.buffetId).toBe('buffet-hist');
      expect(component.buffetName).toBe('');
    });

    it('dado que no hay ningun state, deberia navegar al dashboard directivo', () => {
      spyOn(console, 'warn');
      history.replaceState({}, '', location.href);

      whenMonto();

      expect(router.navigate).toHaveBeenCalledWith(['/directivo']);
      expect(component.buffetId).toBeNull();
    });
  });

  describe('onSubmit', () => {
    it('dado un buffetId cargado, cuando envio el formulario, deberia delegar al presenter con esos datos', () => {
      component.buffetId = 'buffet-1';
      const data = {
        username: 'usuario',
        dni: '20000000',
        firstName: 'Carlos',
        lastName: 'Perez',
        email: 'carlos@example.com',
        phone: '011-0000',
        cuit: '20200000005',
      } as CrearVendedorRequest;

      component.onSubmit(data);

      expect(presenter.asignar).toHaveBeenCalledWith('buffet-1', data);
    });

    it('dado sin buffetId, cuando envio el formulario, no deberia llamar al presenter', () => {
      component.buffetId = null;

      component.onSubmit({} as CrearVendedorRequest);

      expect(presenter.asignar).not.toHaveBeenCalled();
    });
  });

  describe('render', () => {
    it('dado buffetName, deberia mostrarlo en el header', () => {
      history.replaceState({ buffetId: 'b1', buffetName: 'Kiosco Central' }, '', location.href);

      whenMonto();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Kiosco Central');
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
