import {
  InvitacionTutor,
  InvitacionTutorPayload,
} from '../models/invitacion-tutor.model';

export class InvitarTutorPayloadMother {
  static crear(
    override: Partial<InvitacionTutorPayload> = {},
  ): InvitacionTutorPayload {
    return {
      email: 'maria.tutora@test.com',
      firstName: 'Maria',
      lastName: 'Gomez',
      phone: '1122334455',
      ...override,
    };
  }

  static soloEmail(): InvitacionTutorPayload {
    return { email: 'maria.tutora@test.com' };
  }
}

export class InvitacionTutorMother {
  static creada(override: Partial<InvitacionTutor> = {}): InvitacionTutor {
    return {
      id: '3c8e59df-9053-4648-a1ab-24ebf83328d4',
      schoolId: '5fd5acd3-ab97-4d95-aa33-a349bf47d0c8',
      schoolName: 'Colegio Demo',
      email: 'maria.tutora@test.com',
      firstName: 'Maria',
      lastName: 'Gomez',
      phone: '1122334455',
      status: 'PENDING',
      expiresAt: '2026-07-09T20:30:00',
      invitationLink:
        'http://localhost:4200/invitaciones/tutor?token=abc123',
      result: 'CREATED',
      ...override,
    };
  }

  static reenviada(): InvitacionTutor {
    return InvitacionTutorMother.creada({ result: 'RESENT' });
  }

  static yaAsociada(): InvitacionTutor {
    return InvitacionTutorMother.creada({
      result: 'ALREADY_ASSOCIATED',
      invitationLink: null,
    });
  }

  static creadaConErrorEmail(): InvitacionTutor {
    return InvitacionTutorMother.creada({ result: 'CREATED_EMAIL_ERROR' });
  }

  static validada(): InvitacionTutor {
    return InvitacionTutorMother.creada({
      result: 'VALIDATED',
      invitationLink: null,
    });
  }
}
