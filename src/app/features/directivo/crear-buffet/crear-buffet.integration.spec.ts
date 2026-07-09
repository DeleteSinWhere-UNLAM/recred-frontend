import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearBuffetPage } from './crear-buffet.page';
import { DirectivoService } from '../services/directivo.service';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {}

describe('CrearBuffet (Integración)', () => {
  let fixture: ComponentFixture<CrearBuffetPage>;
  let directivoServiceSpy: jasmine.SpyObj<DirectivoService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    directivoServiceSpy = jasmine.createSpyObj('DirectivoService', ['crearBuffet']);
    routerSpy = jasmine.createSpyObj('Router', ['getCurrentNavigation', 'navigate']);
    
    routerSpy.getCurrentNavigation.and.returnValue({
      extras: { state: { schoolId: 'school-123' } }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await TestBed.configureTestingModule({
      imports: [CrearBuffetPage],
      providers: [
        { provide: DirectivoService, useValue: directivoServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).overrideComponent(CrearBuffetPage, {
      remove: { imports: [NavbarComponent] },
      add: { imports: [NavbarStub] }
    }).compileComponents();
  });

  it('debería renderizar el formulario y manejar el submit correctamente (Happy Path)', async () => {
    directivoServiceSpy.crearBuffet.and.resolveTo({ buffetId: 'buffet-123' });

    fixture = TestBed.createComponent(CrearBuffetPage);
    fixture.detectChanges();

    const nameInput = fixture.debugElement.query(By.css('#buffetName')).nativeElement;
    nameInput.value = 'Mi Kiosco';
    nameInput.dispatchEvent(new Event('input'));

    const expInput = fixture.debugElement.query(By.css('#expirationDate')).nativeElement;
    expInput.value = '2027-12-31';
    expInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', null);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(directivoServiceSpy.crearBuffet).toHaveBeenCalledWith('school-123', {
      name: 'Mi Kiosco',
      habilitationExpirationDate: '2027-12-31'
    });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/directivo']);
  });
});
