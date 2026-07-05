import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { RegistroColegioPage } from './registro-colegio.page';
import { RegistroColegioService } from './services/registro-colegio.service';
import { ToastService } from '../../shared/services/toast.service';

const CAMPOS_FORM_VALIDOS = {
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
};

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

  it('dado el componente montado, cuando se renderiza, deberia mostrar el formulario con titulo y selector de niveles', () => {
    const titulo = fixture.nativeElement.querySelector('.rc__title').textContent;
    const select = fixture.nativeElement.querySelector('#schoolLevelId');
    const opciones = fixture.debugElement.queryAll(By.css('#schoolLevelId option'));

    expect(titulo).toContain('Registro de Institución Educativa');
    expect(select).toBeTruthy();
    expect(opciones.length).toBeGreaterThan(1);
  });

  it('dado el form completo, cuando envio y el servicio responde OK, deberia mostrar el panel de exito y ocultar el form', () => {
    givenSubmitRegistrationResuelveOk();
    whenCompletoFormEnDOM();

    whenHagoClickEnEnviar();

    const panelExito = fixture.nativeElement.querySelector('#panel-exito');
    const form = fixture.nativeElement.querySelector('.rc__form');
    expect(panelExito).toBeTruthy();
    expect(form).toBeNull();
  });

  it('dado el form completo, cuando envio y el servicio falla, deberia mostrar el banner de error', () => {
    givenSubmitRegistrationFalla();
    whenCompletoFormViaPatchValue();

    whenHagoClickEnEnviar();

    const panelError = fixture.nativeElement.querySelector('#panel-error');
    expect(panelError).toBeTruthy();
    expect(panelError.textContent).toContain('error al enviar');
  });

  function givenSubmitRegistrationResuelveOk(): void {
    servicio.submitRegistration.and.returnValue(of(undefined));
  }

  function givenSubmitRegistrationFalla(): void {
    servicio.submitRegistration.and.returnValue(throwError(() => new Error('Error 500')));
  }

  function whenCompletoFormEnDOM(): void {
    const llenarCampo = (id: string, val: string): void => {
      const el = fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement;
      el.value = val;
      el.dispatchEvent(new Event('input'));
    };
    llenarCampo('schoolName', CAMPOS_FORM_VALIDOS.schoolName);
    llenarCampo('schoolEmail', CAMPOS_FORM_VALIDOS.schoolEmail);
    llenarCampo('schoolPhone', CAMPOS_FORM_VALIDOS.schoolPhone);
    llenarCampo('schoolCue', CAMPOS_FORM_VALIDOS.schoolCue);
    const select = fixture.nativeElement.querySelector('#schoolLevelId') as HTMLSelectElement;
    select.value = CAMPOS_FORM_VALIDOS.schoolLevelId;
    select.dispatchEvent(new Event('change'));
    llenarCampo('directorFirstName', CAMPOS_FORM_VALIDOS.directorFirstName);
    llenarCampo('directorLastName', CAMPOS_FORM_VALIDOS.directorLastName);
    llenarCampo('directorEmail', CAMPOS_FORM_VALIDOS.directorEmail);
    llenarCampo('directorPhone', CAMPOS_FORM_VALIDOS.directorPhone);
    llenarCampo('directorDni', CAMPOS_FORM_VALIDOS.directorDni);
    llenarCampo('directorUsername', CAMPOS_FORM_VALIDOS.directorUsername);
    fixture.detectChanges();
  }

  function whenCompletoFormViaPatchValue(): void {
    fixture.componentInstance.form.patchValue(CAMPOS_FORM_VALIDOS);
    fixture.detectChanges();
  }

  function whenHagoClickEnEnviar(): void {
    fixture.nativeElement.querySelector('#btn-enviar').click();
    fixture.detectChanges();
  }
});
