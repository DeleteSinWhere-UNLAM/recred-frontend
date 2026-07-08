import {
  ErrorFilaCsv,
  ReporteImportacionCsv,
} from '../models/invitacion-tutor.model';

export class ErrorFilaCsvMother {
  static crear(override: Partial<ErrorFilaCsv> = {}): ErrorFilaCsv {
    return {
      row: 3,
      email: 'mail-mal',
      message: 'Invalid email',
      ...override,
    };
  }
}

export class ReporteImportacionCsvMother {
  static sinErrores(
    override: Partial<ReporteImportacionCsv> = {},
  ): ReporteImportacionCsv {
    return {
      totalRows: 2,
      createdInvitations: 2,
      resentInvitations: 0,
      alreadyAssociated: 0,
      errors: [],
      ...override,
    };
  }

  static conErrores(): ReporteImportacionCsv {
    return {
      totalRows: 5,
      createdInvitations: 3,
      resentInvitations: 1,
      alreadyAssociated: 0,
      errors: [
        ErrorFilaCsvMother.crear(),
        ErrorFilaCsvMother.crear({ row: 7, email: '', message: 'Email requerido' }),
      ],
    };
  }
}

export class ArchivoCsvMother {
  static valido(): File {
    return new File(['email\nmaria@test.com'], 'tutores.csv', {
      type: 'text/csv',
    });
  }

  static invalido(): File {
    return new File(['contenido'], 'tutores.txt', { type: 'text/plain' });
  }
}
