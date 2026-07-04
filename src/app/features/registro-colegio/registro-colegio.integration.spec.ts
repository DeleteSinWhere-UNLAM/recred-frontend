import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { RegistroColegioPage } from './registro-colegio.page';
import { RegistroColegioService } from './services/registro-colegio.service';
import { ToastService } from '../../shared/services/toast.service';

describe('RegistroColegio Integration', () => {
  let fixture: ComponentFixture<RegistroColegioPage>;
  let servicio: jasmine.SpyObj<RegistroColegioService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    servicio = jasmine.createSpyObj('RegistroColegioService', ['submitRegistration']);
    toast = jasmine.createSpyObj('ToastService', ['mostrar']);

    await TestBed.configureTestingModule({
      imports: [RegistroColegioPage, ReactiveFormsModule],
      providers: [
        { provide: RegistroColegioService, useValue: servicio },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroColegioPage);
    fixture.detectChanges();
  });

  it('debería renderizar el formulario con el título y el selector de niveles educativos', () => {
    const titulo = fixture.nativeElement.querySelector('.rc__title').textContent;
    const select = fixture.nativeElement.querySelector('#schoolLevelId');
    const opciones = fixture.debugElement.queryAll(By.css('#schoolLevelId option'));

    expect(titulo).toContain('Registro de Institución Educativa');
    expect(select).toBeTruthy();
    expect(opciones.length).toBeGreaterThan(1);
  });

  it('debería mostrar el panel de éxito y ocultar el formulario cuando el servicio responde correctamente', () => {
    servicio.submitRegistration.and.returnValue(of(undefined));
    const llenarCampo = (id: string, val: string) => {
      const el: HTMLInputElement = fixture.nativeElement.querySelector(`#${id}`);
      el.value = val;
      el.dispatchEvent(new Event('input'));
    };
    llenarCampo('schoolName', 'Instituto Test');
    llenarCampo('schoolEmail', 'test@test.com');
    llenarCampo('schoolPhone', '011-1234');
    llenarCampo('schoolCue', '123');
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#schoolLevelId');
    select.value = '44444444-4444-4444-4444-444444444444';
    select.dispatchEvent(new Event('change'));
    llenarCampo('directorFirstName', 'Juan');
    llenarCampo('directorLastName', 'Pérez');
    llenarCampo('directorEmail', 'juan@test.com');
    llenarCampo('directorPhone', '15-1234');
    llenarCampo('directorDni', '12345678');
    llenarCampo('directorUsername', 'juanperez');
    fixture.detectChanges();

    fixture.nativeElement.querySelector('#btn-enviar').click();
    fixture.detectChanges();

    const panelExito = fixture.nativeElement.querySelector('#panel-exito');
    const form = fixture.nativeElement.querySelector('.rc__form');
    expect(panelExito).toBeTruthy();
    expect(form).toBeNull();
  });

  it('debería mostrar el banner de error cuando el servicio falla', () => {
    servicio.submitRegistration.and.returnValue(throwError(() => new Error('Error 500')));
    fixture.componentInstance.form.patchValue({
      schoolName: 'Instituto Test',
      schoolEmail: 'test@test.com',
      schoolPhone: '011-1234',
      schoolCue: '123',
      schoolLevelId: '44444444-4444-4444-4444-444444444444',
      directorFirstName: 'Juan',
      directorLastName: 'Pérez',
      directorEmail: 'juan@test.com',
      directorPhone: '15-1234',
      directorDni: '12345678',
      directorUsername: 'juanperez',
    });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('#btn-enviar').click();
    fixture.detectChanges();

    const panelError = fixture.nativeElement.querySelector('#panel-error');
    expect(panelError).toBeTruthy();
    expect(panelError.textContent).toContain('error al enviar');
  });
});
