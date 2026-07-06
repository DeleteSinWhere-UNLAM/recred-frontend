import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { AlumnoMother } from '../../data-access/services/alumno.mother';
import { TransferirSaldoPresenter } from './presenter/transferir-saldo.presenter';
import { TransferirSaldoPage } from './transferir-saldo.page';

interface PresenterFake {
  init: jasmine.Spy;
  transferir: jasmine.Spy;
  alumnoOrigen: ReturnType<typeof signal<ReturnType<typeof AlumnoMother.crear> | undefined>>;
  historialTransferencias: ReturnType<typeof signal<unknown[]>>;
  cargando: ReturnType<typeof signal<boolean>>;
  nombreCompleto: ReturnType<typeof signal<string>>;
  grado: ReturnType<typeof signal<string>>;
  urlFotoPerfil: ReturnType<typeof signal<string | null>>;
  otrosHijos: ReturnType<typeof signal<ReturnType<typeof AlumnoMother.crear>[]>>;
}

describe('TransferirSaldoPage', () => {
  const ALUMNO_ID = 'alumno-1';

  let component: TransferirSaldoPage;
  let fixture: ComponentFixture<TransferirSaldoPage>;
  let presenter: PresenterFake;
  let alumnoIdSignal: ReturnType<typeof signal<string>>;

  beforeEach(async () => {
    alumnoIdSignal = signal(ALUMNO_ID);

    presenter = {
      init: jasmine.createSpy('init').and.resolveTo(),
      transferir: jasmine.createSpy('transferir').and.resolveTo(true),
      alumnoOrigen: signal(AlumnoMother.crear({ id: ALUMNO_ID, saldo: 1500 })),
      historialTransferencias: signal([]),
      cargando: signal(false),
      nombreCompleto: signal('Juan Perez'),
      grado: signal('5to A'),
      urlFotoPerfil: signal<string | null>(null),
      otrosHijos: signal([]),
    };

    await TestBed.configureTestingModule({
      imports: [TransferirSaldoPage],
      providers: [
        {
          provide: AlumnoContextoService,
          useValue: { alumnoId: alumnoIdSignal.asReadonly() },
        },
      ],
    })
      .overrideComponent(TransferirSaldoPage, {
        set: {
          providers: [{ provide: TransferirSaldoPresenter, useValue: presenter }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TransferirSaldoPage);
    component = fixture.componentInstance;
  });

  describe('effect de contexto', () => {
    it('dado un alumnoId en el contexto, cuando se monta la page, deberia inicializar el presenter con ese id', () => {
      fixture.detectChanges();

      expect(presenter.init).toHaveBeenCalledWith(ALUMNO_ID);
    });

    it('dado un alumnoId vacio, cuando cambia el contexto, no deberia inicializar el presenter', () => {
      givenAlumnoIdEnContexto('');
      fixture.detectChanges();

      expect(presenter.init).not.toHaveBeenCalled();
    });
  });

  describe('selectMonto', () => {
    it('dado un monto, cuando lo selecciono, deberia setear montoIngresado', () => {
      whenLlamoProtegido('selectMonto', 200);

      expect(component.montoIngresado).toBe(200);
    });
  });

  describe('saldoFormateado', () => {
    it('dado un alumno con saldo, cuando pido el saldo formateado, deberia contener $ y el numero', () => {
      const formateado = (component as unknown as { saldoFormateado: string }).saldoFormateado;

      expect(formateado).toContain('$');
      expect(formateado).toContain('1.500');
    });

    it('dado sin alumno cargado, cuando pido el saldo formateado, deberia mostrar $0', () => {
      presenter.alumnoOrigen.set(undefined);

      const formateado = (component as unknown as { saldoFormateado: string }).saldoFormateado;

      expect(formateado).toContain('0');
    });
  });

  describe('onSubmit', () => {
    it('dado una transferencia exitosa, cuando envio el form, deberia limpiar montoIngresado y destinoAlumnoId', async () => {
      component.montoIngresado = 500;
      component.destinoAlumnoId = 'destino-1';

      await whenEnvioElForm();

      expect(presenter.transferir).toHaveBeenCalledWith('destino-1', 500);
      expect(component.montoIngresado).toBe(0);
      expect(component.destinoAlumnoId).toBe('');
    });

    it('dado una transferencia fallida, cuando envio el form, no deberia limpiar los campos', async () => {
      presenter.transferir.and.resolveTo(false);
      component.montoIngresado = 500;
      component.destinoAlumnoId = 'destino-1';

      await whenEnvioElForm();

      expect(component.montoIngresado).toBe(500);
      expect(component.destinoAlumnoId).toBe('destino-1');
    });
  });

  function givenAlumnoIdEnContexto(alumnoId: string): void {
    alumnoIdSignal.set(alumnoId);
  }

  function whenLlamoProtegido(metodo: 'selectMonto', arg: number): void {
    (component as unknown as Record<string, (n: number) => void>)[metodo](arg);
  }

  async function whenEnvioElForm(): Promise<void> {
    const event = new Event('submit');
    spyOn(event, 'preventDefault');
    (component as unknown as { onSubmit: (e: Event) => void }).onSubmit(event);
    await Promise.resolve();
  }
});
