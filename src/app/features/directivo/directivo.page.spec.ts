import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectivoPage } from './directivo.page';
import { DirectivoPresenter } from './presenter/directivo.presenter';
import { signal } from '@angular/core';
import { AuthService } from '../../core/auth/services/auth.service';

describe('DirectivoPage (Humble Object Component)', () => {
  let component: DirectivoPage;
  let fixture: ComponentFixture<DirectivoPage>;
  let presenterSpy: jasmine.SpyObj<DirectivoPresenter>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let mensajeSignal: ReturnType<typeof signal<string>>;

  beforeEach(async () => {
    
    mensajeSignal = signal('Cargando...');
    presenterSpy = jasmine.createSpyObj('DirectivoPresenter', ['inicializar'], {
      mensajeBienvenida: mensajeSignal,
    });
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [DirectivoPage],
    })
      .overrideComponent(DirectivoPage, {
        set: {
          providers: [
            { provide: DirectivoPresenter, useValue: presenterSpy },
            { provide: AuthService, useValue: authServiceSpy }
          ],
        },
      })
      .compileComponents();

    
    fixture = TestBed.createComponent(DirectivoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería renderizar el mensaje de bienvenida expuesto por el presenter', () => {
    
    mensajeSignal.set('Hola bienvenido, Maria');
    fixture.detectChanges();

    
    const h1Element = fixture.nativeElement.querySelector('h1');
    expect(h1Element.textContent.trim()).toBe('Hola bienvenido, Maria');
  });

  it('debería inicializar el presenter en el ngOnInit', () => {
    
    component.ngOnInit();

    
    expect(presenterSpy.inicializar).toHaveBeenCalled();
  });
});
