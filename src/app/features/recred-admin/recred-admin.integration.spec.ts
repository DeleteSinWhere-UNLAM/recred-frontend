import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { RecredAdminPage } from './recred-admin.page';
import { RecredAdminService } from './services/recred-admin.service';
import { ToastService } from '../../shared/services/toast.service';
import { RecredAdminMother } from './recred-admin.mother';

describe('RecredAdmin Integration', () => {
  let fixture: ComponentFixture<RecredAdminPage>;
  let servicio: jasmine.SpyObj<RecredAdminService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    servicio = jasmine.createSpyObj('RecredAdminService', ['getPendingRegistrations', 'approveRegistration', 'rejectRegistration']);
    toast = jasmine.createSpyObj('ToastService', ['mostrar']);

    await TestBed.configureTestingModule({
      imports: [RecredAdminPage],
      providers: [
        { provide: RecredAdminService, useValue: servicio },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();
  });

  it('debería renderizar las tarjetas con los nombres de los colegios pendientes cuando el servicio responde', () => {
    const solicitudes = RecredAdminMother.crearListaSolicitudes();
    servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
    fixture = TestBed.createComponent(RecredAdminPage);

    fixture.detectChanges();

    const tarjetas = fixture.debugElement.queryAll(By.css('.ra__card'));
    const titulo = fixture.nativeElement.querySelector('.ra__title').textContent;
    const badge = fixture.nativeElement.querySelector('.ra__badge').textContent;
    const primerColegio = tarjetas[0].query(By.css('.ra__school-name')).nativeElement.textContent;
    expect(titulo).toContain('Dashboard Recred Admin');
    expect(tarjetas.length).toBe(2);
    expect(badge).toContain('2 pendientes');
    expect(primerColegio).toContain('Instituto San José');
  });

  it('debería mostrar el estado vacío cuando no hay solicitudes pendientes', () => {
    servicio.getPendingRegistrations.and.returnValue(of([]));
    fixture = TestBed.createComponent(RecredAdminPage);

    fixture.detectChanges();

    const tarjetas = fixture.debugElement.queryAll(By.css('.ra__card'));
    const vacio = fixture.nativeElement.querySelector('.ra__empty');
    expect(tarjetas.length).toBe(0);
    expect(vacio).toBeTruthy();
    expect(vacio.textContent).toContain('No hay solicitudes pendientes');
  });

  it('debería mostrar el error cuando el servicio falla al cargar las solicitudes', () => {
    servicio.getPendingRegistrations.and.returnValue(throwError(() => new Error('API Error')));
    fixture = TestBed.createComponent(RecredAdminPage);

    fixture.detectChanges();

    const panelError = fixture.nativeElement.querySelector('.ra__error');
    expect(panelError).toBeTruthy();
    expect(panelError.textContent).toContain('Error al cargar las solicitudes pendientes.');
  });

  it('debería eliminar la tarjeta del DOM al aprobar una solicitud exitosamente', () => {
    const solicitudes = RecredAdminMother.crearListaSolicitudes();
    servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
    servicio.approveRegistration.and.returnValue(of(undefined));
    fixture = TestBed.createComponent(RecredAdminPage);
    fixture.detectChanges();

    const btnAprobar = fixture.nativeElement.querySelector('#btn-aprobar-solicitud-1');
    btnAprobar.click();
    fixture.detectChanges();

    const tarjetas = fixture.debugElement.queryAll(By.css('.ra__card'));
    expect(tarjetas.length).toBe(1);
    expect(fixture.nativeElement.querySelector('#card-solicitud-1')).toBeNull();
  });

  it('debería eliminar la tarjeta del DOM al rechazar una solicitud exitosamente', () => {
    const solicitudes = RecredAdminMother.crearListaSolicitudes();
    servicio.getPendingRegistrations.and.returnValue(of(solicitudes));
    servicio.rejectRegistration.and.returnValue(of(undefined));
    fixture = TestBed.createComponent(RecredAdminPage);
    fixture.detectChanges();

    const btnRechazar = fixture.nativeElement.querySelector('#btn-rechazar-solicitud-2');
    btnRechazar.click();
    fixture.detectChanges();

    const tarjetas = fixture.debugElement.queryAll(By.css('.ra__card'));
    expect(tarjetas.length).toBe(1);
    expect(fixture.nativeElement.querySelector('#card-solicitud-2')).toBeNull();
  });
});
