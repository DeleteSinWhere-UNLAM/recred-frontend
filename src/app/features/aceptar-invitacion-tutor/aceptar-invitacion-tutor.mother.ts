import { InvitacionTutor } from '../directivo/models/invitacion-tutor.model';

export class InvitacionValidadaMother {
  static crear(override: Partial<InvitacionTutor> = {}): InvitacionTutor {
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
      invitationLink: null,
      result: 'VALIDATED',
      ...override,
    };
  }
}
