import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { RecredAdminPage } from './recred-admin.page';
import { RecredAdminService } from './services/recred-admin.service';
import { ToastService } from '../../shared/services/toast.service';
import { RecredAdminMother } from './recred-admin.mother';
import { AuthService } from '../../core/auth/services/auth.service';

describe('RecredAdmin Integration', () => {
  let fixture: ComponentFixture<RecredAdminPage>;
  let servicio: jasmine.SpyObj<RecredAdminService>;
  let toast: jasmine.SpyObj<ToastService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    servicio = jasmine.createSpyObj('RecredAdminService', ['getPendingRegistrations', 'approveRegistration', 'rejectRegistration']);
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
        providers: [
          { provide: AuthService, useValue: authServiceSpy }
        ]
      }
    })
    .compileComponents();
  });

  it('debería renderizar las tarjetas con los nombres de los colegios pendientes cuando el servicio responde', () => {
    const solicitudes = RecredAdminMother.crearListaSolicitudes();
    givenSolicitudesPendientes(solicitudes);
    whenInicializoComponente();
    thenSeMuestranLasSolicitudes(solicitudes);
  });

  it('debería mostrar el estado vacío cuando no hay solicitudes pendientes', () => {
    givenSinSolicitudesPendientes();
    whenInicializoComponente();
    thenSeMuestraEstadoVacio();
  });

  it('debería mostrar el error cuando el servicio falla al cargar las solicitudes', () => {
    givenErrorAlObtenerSolicitudes();
    whenInicializoComponente();
    thenSeMuestraError();
  });

  it('debería eliminar la tarjeta del DOM al aprobar una solicitud exitosamente', () => {
    const solicitudes = RecredAdminMother.crearListaSolicitudes();
    givenSolicitudesYApruebo(solicitudes);
    whenHagoClickAprobar();
    thenSeEliminaLaTarjeta();
  });

  it('debería eliminar la tarjeta del DOM al rechazar una solicitud exitosamente', () => {
    const solicitudes = RecredAdminMother.crearListaSolicitudes();
    givenSolicitudesYRechazo(solicitudes);
    whenHagoClickRechazar();
    thenSeEliminaLaTarjetaRechazada();
  });

  function givenSolicitudesPendientes(solicitudes: any[]): void {
    servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
  }

  function givenSinSolicitudesPendientes(): void {
    servicio.getPendingRegistrations.and.returnValue(of([]));
  }

  function givenErrorAlObtenerSolicitudes(): void {
    servicio.getPendingRegistrations.and.returnValue(throwError(() => new Error('API Error')));
  }

  function givenSolicitudesYApruebo(solicitudes: any[]): void {
    servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
    servicio.approveRegistration.and.returnValue(of(undefined));
  }

  function givenSolicitudesYRechazo(solicitudes: any[]): void {
    servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
    servicio.rejectRegistration.and.returnValue(of(undefined));
  }

  function whenInicializoComponente(): void {
    fixture = TestBed.createComponent(RecredAdminPage);
    fixture.detectChanges();
  }

  function whenHagoClickAprobar(): void {
    fixture = TestBed.createComponent(RecredAdminPage);
    fixture.detectChanges();
    const btnAprobar = fixture.nativeElement.querySelector('#btn-aprobar-solicitud-1');
    btnAprobar.click();
    fixture.detectChanges();
  }

  function whenHagoClickRechazar(): void {
    fixture = TestBed.createComponent(RecredAdminPage);
    fixture.detectChanges();
    const btnRechazar = fixture.nativeElement.querySelector('#btn-rechazar-solicitud-2');
    btnRechazar.click();
    fixture.detectChanges();
  }

  function thenSeMuestranLasSolicitudes(solicitudes: any[]): void {
    const tarjetas = fixture.debugElement.queryAll(By.css('.ra__card'));
    const titulo = fixture.nativeElement.querySelector('.ra__title').textContent;
    const badge = fixture.nativeElement.querySelector('.ra__badge').textContent;
    const primerColegio = tarjetas[0].query(By.css('.ra__school-name')).nativeElement.textContent;
    expect(titulo).toContain('Dashboard Recred Admin');
    expect(tarjetas.length).toBe(2);
    expect(badge).toContain('2 pendientes');
    expect(primerColegio).toContain('Instituto San José');
  }

  function thenSeMuestraEstadoVacio(): void {
    const tarjetas = fixture.debugElement.queryAll(By.css('.ra__card'));
    const vacio = fixture.nativeElement.querySelector('.ra__empty');
    expect(tarjetas.length).toBe(0);
    expect(vacio).toBeTruthy();
    expect(vacio.textContent).toContain('No hay solicitudes pendientes');
  }

  function thenSeMuestraError(): void {
    const panelError = fixture.nativeElement.querySelector('.ra__error');
    expect(panelError).toBeTruthy();
    expect(panelError.textContent).toContain('Error al cargar las solicitudes pendientes.');
  }

  function thenSeEliminaLaTarjeta(): void {
    const tarjetas = fixture.debugElement.queryAll(By.css('.ra__card'));
    expect(tarjetas.length).toBe(1);
    expect(fixture.nativeElement.querySelector('#card-solicitud-1')).toBeNull();
  }

  function thenSeEliminaLaTarjetaRechazada(): void {
    const tarjetas = fixture.debugElement.queryAll(By.css('.ra__card'));
    expect(tarjetas.length).toBe(1);
    expect(fixture.nativeElement.querySelector('#card-solicitud-2')).toBeNull();
  }
});
