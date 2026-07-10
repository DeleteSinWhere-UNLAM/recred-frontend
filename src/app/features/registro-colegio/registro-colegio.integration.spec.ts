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
  schoolPhone: '01112345678',
  schoolCue: '123456789',
  directorFirstName: 'Juan',
  directorLastName: 'Pérez',
  directorEmail: 'juan@test.com',
  directorPhone: '1512345678',
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

  it('dado el componente montado, cuando se renderiza, deberia mostrar el formulario con titulo', () => {
    const form = fixture.debugElement.query(By.css('form'));

    expect(form).toBeTruthy();
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
    const cue = fixture.nativeElement.querySelector('#schoolCue') as HTMLInputElement;
    cue.value = CAMPOS_FORM_VALIDOS.schoolCue;
    cue.dispatchEvent(new Event('input'));
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
