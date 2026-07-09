import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsignarVendedorPage } from './asignar-vendedor.page';
import { DirectivoService } from '../services/directivo.service';
import { AsignarVendedorPresenter } from './presenter/asignar-vendedor.presenter';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {}

describe('AsignarVendedor (Integración)', () => {
  let fixture: ComponentFixture<AsignarVendedorPage>;
  let directivoServiceSpy: jasmine.SpyObj<DirectivoService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    directivoServiceSpy = jasmine.createSpyObj('DirectivoService', ['registrarVendedor']);
    routerSpy = jasmine.createSpyObj('Router', ['getCurrentNavigation', 'navigate']);
    
    routerSpy.getCurrentNavigation.and.returnValue({
      extras: { state: { buffetId: 'buffet-123', buffetName: 'Mi Kiosco' } }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await TestBed.configureTestingModule({
      imports: [AsignarVendedorPage],
      providers: [
        { provide: DirectivoService, useValue: directivoServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).overrideComponent(AsignarVendedorPage, {
      remove: { imports: [NavbarComponent] },
      add: { imports: [NavbarStub] }
    }).compileComponents();
  });

  it('debería manejar el submit correctamente (Happy Path)', async () => {
    directivoServiceSpy.registrarVendedor.and.resolveTo({ kiosqueroId: 'k-1', usuarioId: 'u-1' });

    fixture = TestBed.createComponent(AsignarVendedorPage);
    fixture.detectChanges();

    const usernameInput = fixture.debugElement.query(By.css('#username')).nativeElement;
    usernameInput.value = 'jkiosco';
    usernameInput.dispatchEvent(new Event('input'));

    const emailInput = fixture.debugElement.query(By.css('#email')).nativeElement;
    emailInput.value = 'jkiosco@email.com';
    emailInput.dispatchEvent(new Event('input'));

    const firstNameInput = fixture.debugElement.query(By.css('#firstName')).nativeElement;
    firstNameInput.value = 'Juan';
    firstNameInput.dispatchEvent(new Event('input'));

    const lastNameInput = fixture.debugElement.query(By.css('#lastName')).nativeElement;
    lastNameInput.value = 'Perez';
    lastNameInput.dispatchEvent(new Event('input'));

    const dniInput = fixture.debugElement.query(By.css('#dni')).nativeElement;
    dniInput.value = '123456';
    dniInput.dispatchEvent(new Event('input'));

    const cuitInput = fixture.debugElement.query(By.css('#cuit')).nativeElement;
    cuitInput.value = '201234561';
    cuitInput.dispatchEvent(new Event('input'));

    const phoneInput = fixture.debugElement.query(By.css('#phone')).nativeElement;
    phoneInput.value = '11223344';
    phoneInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', null);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(directivoServiceSpy.registrarVendedor).toHaveBeenCalledWith('buffet-123', jasmine.any(Object));
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/directivo']);
  });

  it('debería mostrar error 409', async () => {
    const errorResponse = new HttpErrorResponse({
      status: 409,
      error: { code: 'USERNAME_EXISTS' }
    });
    directivoServiceSpy.registrarVendedor.and.rejectWith(errorResponse);

    fixture = TestBed.createComponent(AsignarVendedorPage);
    fixture.detectChanges();
    
    const presenter = fixture.debugElement.injector.get(AsignarVendedorPresenter);
    await presenter.asignar('buffet-123', {
      username: 'a', email: 'a', firstName: 'a', lastName: 'a', dni: 'a', phone: 'a', cuit: 'a'
    });

    fixture.detectChanges();

    const errorAlert = fixture.debugElement.query(By.css('.error-alert'));
    expect(errorAlert.nativeElement.textContent).toContain('El correo o nombre de usuario ya está registrado.');
    expect(routerSpy.navigate).not.toHaveBeenCalledWith(['/directivo']);
  });
});
