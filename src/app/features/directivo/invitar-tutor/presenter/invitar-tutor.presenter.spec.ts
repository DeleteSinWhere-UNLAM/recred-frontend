import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { InvitacionesTutorService } from '../../services/invitaciones-tutor.service';
import { InvitacionTutor } from '../../models/invitacion-tutor.model';
import {
  InvitacionTutorMother,
  InvitarTutorPayloadMother,
} from '../invitar-tutor.mother';
import { InvitarTutorPresenter } from './invitar-tutor.presenter';

describe('InvitarTutorPresenter', () => {
  let presenter: InvitarTutorPresenter;
  let servicioInvitaciones: jasmine.SpyObj<InvitacionesTutorService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    servicioInvitaciones = jasmine.createSpyObj<InvitacionesTutorService>(
      'InvitacionesTutorService',
      ['invitarTutor'],
    );
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        InvitarTutorPresenter,
        { provide: InvitacionesTutorService, useValue: servicioInvitaciones },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(InvitarTutorPresenter);
  });

  it('dado el presenter recien creado, deberia tener los signals en sus valores iniciales', () => {
    expect(presenter.loading()).toBeFalse();
    expect(presenter.error()).toBeNull();
    expect(presenter.resultado()).toBeNull();
  });

  describe('invitar', () => {
    it('dado un payload valido, cuando invito, deberia exponer la invitacion en el signal resultado', async () => {
      const invitacion = InvitacionTutorMother.creada();
      givenElBackDevuelve(invitacion);

      await whenInvito(InvitarTutorPayloadMother.crear());

      expect(servicioInvitaciones.invitarTutor).toHaveBeenCalledWith(
        InvitarTutorPayloadMother.crear(),
      );
      expect(presenter.resultado()).toEqual(invitacion);
      expect(presenter.error()).toBeNull();
      expect(presenter.loading()).toBeFalse();
    });

    it('dado un payload con solo email, cuando invito, deberia enviar los campos opcionales como undefined', async () => {
      givenElBackDevuelve(InvitacionTutorMother.creada());

      await whenInvito(InvitarTutorPayloadMother.soloEmail());

      expect(servicioInvitaciones.invitarTutor).toHaveBeenCalledWith({
        email: 'maria.tutora@test.com',
      });
    });

    it('dado que el back responde RESENT, cuando invito, deberia exponer el resultado con ese estado', async () => {
      givenElBackDevuelve(InvitacionTutorMother.reenviada());

      await whenInvito(InvitarTutorPayloadMother.crear());

      expect(presenter.resultado()?.result).toBe('RESENT');
    });

    it('dado un error 400 con mensaje del back, cuando invito, deberia usar ese mensaje', async () => {
      givenElBackFallaCon(400, 'Email invalido');

      await whenInvito(InvitarTutorPayloadMother.crear());

      expect(presenter.error()).toBe('Email invalido');
      expect(presenter.resultado()).toBeNull();
    });

    it('dado un error 400 sin body, cuando invito, deberia usar el mensaje por defecto', async () => {
      givenElBackFallaCon(400);

      await whenInvito(InvitarTutorPayloadMother.crear());

      expect(presenter.error()).toBe('Datos inválidos. Revisá el email.');
    });

    it('dado un error 403, cuando invito, deberia mostrar mensaje de sin permisos', async () => {
      givenElBackFallaCon(403);

      await whenInvito(InvitarTutorPayloadMother.crear());

      expect(presenter.error()).toBe('No tenés permisos para invitar tutores.');
    });

    it('dado un error 500, cuando invito, deberia mostrar mensaje de error del servidor', async () => {
      givenElBackFallaCon(500);

      await whenInvito(InvitarTutorPayloadMother.crear());

      expect(presenter.error()).toBe('Error del servidor. Intentá más tarde.');
    });

    it('dado un error que no es HTTP, cuando invito, deberia usar el mensaje generico', async () => {
      servicioInvitaciones.invitarTutor.and.rejectWith(new Error('boom'));

      await whenInvito(InvitarTutorPayloadMother.crear());

      expect(presenter.error()).toBe(
        'No se pudo enviar la invitación. Intentá nuevamente.',
      );
    });
  });

  describe('limpiarResultado', () => {
    it('dado un resultado y un error previo, cuando limpio, deberia dejar ambos signals en null', async () => {
      givenElBackDevuelve(InvitacionTutorMother.creada());
      await whenInvito(InvitarTutorPayloadMother.crear());

      presenter.limpiarResultado();

      expect(presenter.resultado()).toBeNull();
      expect(presenter.error()).toBeNull();
    });
  });

  describe('volver', () => {
    it('cuando llamo volver, deberia navegar a /directivo', () => {
      presenter.volver();

      expect(router.navigate).toHaveBeenCalledWith(['/directivo']);
    });
  });

  function givenElBackDevuelve(invitacion: InvitacionTutor): void {
    servicioInvitaciones.invitarTutor.and.resolveTo(invitacion);
  }

  function givenElBackFallaCon(status: number, mensaje?: string): void {
    servicioInvitaciones.invitarTutor.and.rejectWith(
      new HttpErrorResponse({
        status,
        error: mensaje ? { message: mensaje } : null,
      }),
    );
  }

  function whenInvito(payload: Parameters<InvitarTutorPresenter['invitar']>[0]): Promise<void> {
    return presenter.invitar(payload);
  }
});
