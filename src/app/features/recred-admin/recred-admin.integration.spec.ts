import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { RecredAdminPage } from './recred-admin.page';
import { RecredAdminService } from './services/recred-admin.service';
import { ToastService } from '../../shared/services/toast.service';
import { SchoolRegistration } from './models/solicitud-colegio.model';
import { RecredAdminMother } from './recred-admin.mother';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true
})
class MockNavbarComponent {}

describe('RecredAdmin Integration', () => {
  let fixture: ComponentFixture<RecredAdminPage>;
  let servicio: jasmine.SpyObj<RecredAdminService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    servicio = jasmine.createSpyObj('RecredAdminService', [
      'getPendingRegistrations',
      'approveRegistration',
      'rejectRegistration',
    ]);
    toast = jasmine.createSpyObj('ToastService', ['mostrar']);

    await TestBed.configureTestingModule({
      imports: [RecredAdminPage],
      providers: [
        { provide: RecredAdminService, useValue: servicio },
        { provide: ToastService, useValue: toast },
      ],
    })
      .overrideComponent(RecredAdminPage, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [MockNavbarComponent] }
      })
      .compileComponents();
  });

  it('dado que el back devuelve solicitudes pendientes, cuando se monta la page, deberia renderizar las tarjetas con nombres', () => {
    givenSolicitudesPendientes(RecredAdminMother.crearListaSolicitudes());

    whenMonto();

    const tarjetas = fixture.debugElement.queryAll(By.css('.pv__operation-card'));
    const titulo = fixture.nativeElement.querySelector('h1').textContent;
    const badge = fixture.nativeElement.querySelector('.pv__section-title span').textContent;
    const primerColegio = tarjetas[0].query(By.css('.school-name')).nativeElement.textContent;
    expect(titulo).toContain('Dashboard Recred');
    expect(tarjetas.length).toBe(2);
    expect(badge).toContain('2 Pendientes');
    expect(primerColegio).toContain('Instituto San José');
  });

  it('dado que no hay solicitudes pendientes, cuando se monta la page, deberia mostrar el estado vacio', () => {
    givenSolicitudesPendientes([]);

    whenMonto();

    const tarjetas = fixture.debugElement.queryAll(By.css('.pv__operation-card'));
    const vacio = fixture.nativeElement.querySelector('.pv__ok-state');
    expect(tarjetas.length).toBe(0);
    expect(vacio).toBeTruthy();
    expect(vacio.textContent).toContain('No hay solicitudes pendientes');
  });

  it('dado que el servicio falla al cargar, cuando se monta la page, deberia mostrar el panel de error', () => {
    givenGetPendingRegistrationsFalla();

    whenMonto();

    const panelError = fixture.nativeElement.querySelector('.pv__notice--error');
    expect(panelError).toBeTruthy();
    expect(panelError.textContent).toContain('Error al cargar las solicitudes pendientes.');
  });

  it('dado la lista renderizada, cuando hago click en aprobar, deberia sacar la tarjeta del DOM', () => {
    givenSolicitudesPendientes(RecredAdminMother.crearListaSolicitudes());
    servicio.approveRegistration.and.returnValue(of(undefined));
    whenMonto();

    whenHagoClickEn('#btn-aprobar-solicitud-1');

    const tarjetas = fixture.debugElement.queryAll(By.css('.pv__operation-card'));
    expect(tarjetas.length).toBe(1);
    expect(fixture.nativeElement.querySelector('#card-solicitud-1')).toBeNull();
  });

  it('dado la lista renderizada, cuando hago click en rechazar, deberia sacar la tarjeta del DOM', () => {
    givenSolicitudesPendientes(RecredAdminMother.crearListaSolicitudes());
    servicio.rejectRegistration.and.returnValue(of(undefined));
    whenMonto();

    whenHagoClickEn('#btn-rechazar-solicitud-2');

    const tarjetas = fixture.debugElement.queryAll(By.css('.pv__operation-card'));
    expect(tarjetas.length).toBe(1);
    expect(fixture.nativeElement.querySelector('#card-solicitud-2')).toBeNull();
  });

  function givenSolicitudesPendientes(solicitudes: SchoolRegistration[]): void {
    servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
  }

  function givenGetPendingRegistrationsFalla(): void {
    servicio.getPendingRegistrations.and.returnValue(throwError(() => new Error('API Error')));
  }

  function whenMonto(): void {
    fixture = TestBed.createComponent(RecredAdminPage);
    fixture.detectChanges();
  }

  function whenHagoClickEn(selector: string): void {
    const btn = fixture.nativeElement.querySelector(selector);
    btn.click();
    fixture.detectChanges();
  }
});
