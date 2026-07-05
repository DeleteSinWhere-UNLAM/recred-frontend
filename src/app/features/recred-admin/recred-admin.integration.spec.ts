import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { RecredAdminPage } from './recred-admin.page';
import { RecredAdminService } from './services/recred-admin.service';
import { ToastService } from '../../shared/services/toast.service';
import { SchoolRegistration } from './models/solicitud-colegio.model';
import { RecredAdminMother } from './recred-admin.mother';
import { AuthService } from '../../core/auth/services/auth.service';

describe('RecredAdmin Integration', () => {
  let fixture: ComponentFixture<RecredAdminPage>;
  let servicio: jasmine.SpyObj<RecredAdminService>;
  let toast: jasmine.SpyObj<ToastService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    servicio = jasmine.createSpyObj('RecredAdminService', [
      'getPendingRegistrations',
      'approveRegistration',
      'rejectRegistration',
    ]);
    toast = jasmine.createSpyObj('ToastService', ['mostrar']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [RecredAdminPage],
      providers: [
        { provide: RecredAdminService, useValue: servicio },
        { provide: ToastService, useValue: toast },
      ],
    })
      .overrideComponent(RecredAdminPage, {
        add: {
          providers: [{ provide: AuthService, useValue: authServiceSpy }],
        },
      })
      .compileComponents();
  });

  it('dado que el back devuelve solicitudes pendientes, cuando se monta la page, deberia renderizar las tarjetas con nombres', () => {
    givenSolicitudesPendientes(RecredAdminMother.crearListaSolicitudes());

    whenMonto();

    const tarjetas = fixture.debugElement.queryAll(By.css('.ra__card'));
    const titulo = fixture.nativeElement.querySelector('.ra__title').textContent;
    const badge = fixture.nativeElement.querySelector('.ra__badge').textContent;
    const primerColegio = tarjetas[0].query(By.css('.ra__school-name')).nativeElement.textContent;
    expect(titulo).toContain('Dashboard Recred Admin');
    expect(tarjetas.length).toBe(2);
    expect(badge).toContain('2 pendientes');
    expect(primerColegio).toContain('Instituto San José');
  });

  it('dado que no hay solicitudes pendientes, cuando se monta la page, deberia mostrar el estado vacio', () => {
    givenSolicitudesPendientes([]);

    whenMonto();

    const tarjetas = fixture.debugElement.queryAll(By.css('.ra__card'));
    const vacio = fixture.nativeElement.querySelector('.ra__empty');
    expect(tarjetas.length).toBe(0);
    expect(vacio).toBeTruthy();
    expect(vacio.textContent).toContain('No hay solicitudes pendientes');
  });

  it('dado que el servicio falla al cargar, cuando se monta la page, deberia mostrar el panel de error', () => {
    givenGetPendingRegistrationsFalla();

    whenMonto();

    const panelError = fixture.nativeElement.querySelector('.ra__error');
    expect(panelError).toBeTruthy();
    expect(panelError.textContent).toContain('Error al cargar las solicitudes pendientes.');
  });

  it('dado la lista renderizada, cuando hago click en aprobar, deberia sacar la tarjeta del DOM', () => {
    givenSolicitudesPendientes(RecredAdminMother.crearListaSolicitudes());
    servicio.approveRegistration.and.returnValue(of(undefined));
    whenMonto();

    whenHagoClickEn('#btn-aprobar-solicitud-1');

    const tarjetas = fixture.debugElement.queryAll(By.css('.ra__card'));
    expect(tarjetas.length).toBe(1);
    expect(fixture.nativeElement.querySelector('#card-solicitud-1')).toBeNull();
  });

  it('dado la lista renderizada, cuando hago click en rechazar, deberia sacar la tarjeta del DOM', () => {
    givenSolicitudesPendientes(RecredAdminMother.crearListaSolicitudes());
    servicio.rejectRegistration.and.returnValue(of(undefined));
    whenMonto();

    whenHagoClickEn('#btn-rechazar-solicitud-2');

    const tarjetas = fixture.debugElement.queryAll(By.css('.ra__card'));
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
