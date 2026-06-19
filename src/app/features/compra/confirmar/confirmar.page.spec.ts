import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmarPage } from './confirmar.page';
import { ConfirmarPresenter } from './presenter/confirmar.presenter';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ConfirmarPage', () => {
  let component: ConfirmarPage;
  let fixture: ComponentFixture<ConfirmarPage>;
  let mockPresenter: jasmine.SpyObj<ConfirmarPresenter>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockPresenter = jasmine.createSpyObj('ConfirmarPresenter', ['vacia'], {
      ordenes: signal([
        { alumno: { id: 'a1', nombre: 'Test', apellido: 'User' }, subtotal: 1000 }
      ])
    });

    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);

    const mockUsuarioService = {
      nombreNavbar: signal('Test')
    };

    await TestBed.configureTestingModule({
      imports: [ConfirmarPage],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: UsuarioService, useValue: mockUsuarioService },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .overrideComponent(ConfirmarPage, {
      set: {
        providers: [
          { provide: ConfirmarPresenter, useValue: mockPresenter }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmarPage);
    component = fixture.componentInstance;
  });

  it('deberia crearse', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('debe navegar a /compra si la orden esta vacia', () => {
      mockPresenter.vacia.and.returnValue(true);
      fixture.detectChanges(); // triggers ngOnInit
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/compra');
    });

    it('no debe navegar si hay ordenes', () => {
      mockPresenter.vacia.and.returnValue(false);
      fixture.detectChanges();
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('lineas', () => {
    it('debe mapear ordenes a lineas resumen', () => {
      fixture.detectChanges();
      const lineas = component['lineas']();
      expect(lineas.length).toBe(1);
      expect(lineas[0].alumnoId).toBe('a1');
      expect(lineas[0].nombre).toBe('Test User');
      expect(lineas[0].subtotal).toBe(1000);
      expect(lineas[0].incluido).toBe(true);
    });
  });

  describe('formatear', () => {
    it('debe formatear precio usando Intl', () => {
      const result = component['formatear'](1500.50);
      expect(result.includes('$')).toBeTrue();
      expect(result.includes('1501') || result.includes('1.501')).toBeTrue();
    });
  });
});
