import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { SugerenciasAgregarPage } from './sugerencias-agregar.page';
import { SugerenciasAgregarPresenter } from './presenter/sugerencias-agregar.presenter';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { Component, Input } from '@angular/core';

import { } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
class Mock{
  @Input() userName = '';
}

describe('SugerenciasAgregarPage', () => {
  let component: SugerenciasAgregarPage;
  let fixture: ComponentFixture<SugerenciasAgregarPage>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockUsuarioService: jasmine.SpyObj<UsuarioService>;
  let mockPresenter: jasmine.SpyObj<SugerenciasAgregarPresenter>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);

    mockUsuarioService = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual', 'setHomeUrl']);
    mockUsuarioService.getUsuarioActual.and.returnValue({ id: 'user-1', nombre: 'Test Kiosquero', rol: 'KIOSQUERO' } as ReturnType<UsuarioService['getUsuarioActual']>);

    mockPresenter = jasmine.createSpyObj('SugerenciasAgregarPresenter', ['initialize'], {
      isLoading$: of(false),
      error$: of(null),
      sugerencias$: of([]),
      totalProductos: 0,
      totalVentas: 0,
      totalIngresosLabel: '$0',
      totalClientes: 0,
      chartData: [],
      productCards: [],
      formatCurrency: (val: number) => `$${val}`
    });

    await TestBed.configureTestingModule({
      imports: [SugerenciasAgregarPage, Mock],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: UsuarioService, useValue: mockUsuarioService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
      .overrideComponent(SugerenciasAgregarPage, {
        remove: {
          imports: []
        },
        add: {
          imports: [Mock],
          providers: [
            { provide: SugerenciasAgregarPresenter, useValue: mockPresenter }
          ]
        }
      })
      .compileComponents();

    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ id: 'user-1', nombre: 'Test' }));

    fixture = TestBed.createComponent(SugerenciasAgregarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  it('debería llamar a setHomeUrl al construirse', () => {
    expect(mockUsuarioService.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
  });

  it('debería inicializar el presenter en ngOnInit si hay un usuario en localStorage', () => {
    component.ngOnInit();
    expect(mockPresenter.initialize).toHaveBeenCalledWith('user-1');
  });

  it('no debería inicializar el presenter si no hay usuario en localStorage', () => {
    mockPresenter.initialize.calls.reset();
    (localStorage.getItem as jasmine.Spy).and.returnValue(null);

    component.ngOnInit();

    expect(mockPresenter.initialize).not.toHaveBeenCalled();
  });

  it('volver debería navegar a /kiosquero', () => {
    component.volver();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
  });
});
