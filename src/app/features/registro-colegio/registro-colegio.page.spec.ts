import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroColegioMother } from './registro-colegio.mother';
import { RegistroColegioPage } from './registro-colegio.page';
import { RegistroColegioPresenter } from './presenter/registro-colegio.presenter';

const CAMPOS_FORM_VALIDOS = {
  schoolName: 'Instituto Test',
  schoolEmail: 'test@test.com',
  schoolPhone: '011-1234',
  schoolCue: '123',
  directorFirstName: 'Juan',
  directorLastName: 'Pérez',
  directorEmail: 'juan@test.com',
  directorPhone: '15-1234',
  directorDni: '12345678',
  directorUsername: 'juanperez',
};

describe('RegistroColegioPage', () => {
  let component: RegistroColegioPage;
  let fixture: ComponentFixture<RegistroColegioPage>;
  let presenterSpy: jasmine.SpyObj<RegistroColegioPresenter>;

  beforeEach(async () => {
    presenterSpy = jasmine.createSpyObj<RegistroColegioPresenter>(
      'RegistroColegioPresenter',
      ['enviarSolicitud'],
      {
        cargando$: { subscribe: () => ({ unsubscribe: () => undefined }) } as never,
        enviado$: { subscribe: () => ({ unsubscribe: () => undefined }) } as never,
        error$: { subscribe: () => ({ unsubscribe: () => undefined }) } as never,
      },
    );

    await TestBed.configureTestingModule({
      imports: [RegistroColegioPage],
    })
      .overrideComponent(RegistroColegioPage, {
        set: {
          providers: [{ provide: RegistroColegioPresenter, useValue: presenterSpy }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RegistroColegioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('ngOnInit', () => {
    it('dado la page, cuando se monta, deberia crear el form con todos los controles requeridos', () => {
      const controles = Object.keys(component.form.controls);

      expect(controles).toContain('schoolName');
      expect(controles).toContain('schoolEmail');
      expect(controles).toContain('directorDni');
      expect(controles.length).toBe(10);
    });

    it('dado el form recien creado, cuando lo consulto, deberia estar invalido', () => {
      expect(component.form.invalid).toBeTrue();
    });
  });

  describe('enviar', () => {
    it('dado el form invalido, cuando envio, no deberia llamar al presenter', () => {
      component.enviar();

      expect(presenterSpy.enviarSolicitud).not.toHaveBeenCalled();
    });

    it('dado el form valido, cuando envio, deberia llamar al presenter con el payload mapeado', () => {
      givenFormValido();

      component.enviar();

      expect(presenterSpy.enviarSolicitud).toHaveBeenCalledWith(
        jasmine.objectContaining({
          schoolName: 'Instituto Test',
          schoolEmail: 'test@test.com',
          directorFirstName: 'Juan',
          directorDni: '12345678',
        }),
      );
    });

    it('dado un payload esperado de la Mother, cuando envio, deberia matchear la forma que espera el back', () => {
      const payload = RegistroColegioMother.crearPayload();

      expect(payload.schoolName).toBeDefined();
      expect(payload.directorDni).toBeDefined();
    });
  });


  function givenFormValido(): void {
    component.form.patchValue(CAMPOS_FORM_VALIDOS);
  }
});
