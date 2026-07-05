import { TestBed } from '@angular/core/testing';
import { Recreo } from '../../compra/models/orden-compra.model';
import { RecreaMapperService } from './recrea-mapper.service';

describe('RecreaMapperService', () => {
  let service: RecreaMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [RecreaMapperService] });
    service = TestBed.inject(RecreaMapperService);
  });

  describe('recreoATimeSlotId', () => {
    it('dado PRIMER_RECREO, cuando mapeo, deberia devolver ts-001', () => {
      thenElRecreoMapeaA('PRIMER_RECREO', 'ts-001');
    });

    it('dado SEGUNDO_RECREO, cuando mapeo, deberia devolver ts-002', () => {
      thenElRecreoMapeaA('SEGUNDO_RECREO', 'ts-002');
    });

    it('dado MEDIODIA, cuando mapeo, deberia devolver ts-003', () => {
      thenElRecreoMapeaA('MEDIODIA', 'ts-003');
    });

    it('dado FUERA_HORA, cuando mapeo, deberia devolver ts-004', () => {
      thenElRecreoMapeaA('FUERA_HORA', 'ts-004');
    });
  });

  describe('timeSlotIdARecrea', () => {
    it('dado ts-001, cuando mapeo, deberia devolver PRIMER_RECREO', () => {
      thenElTimeSlotMapeaA('ts-001', 'PRIMER_RECREO');
    });

    it('dado un timeSlotId desconocido, cuando mapeo, deberia devolver null', () => {
      thenElTimeSlotMapeaA('ts-inexistente', null);
    });
  });

  describe('obtenerTodosLosTimeSlotIds', () => {
    it('cuando pido todos los ids, deberia devolver los cuatro time slots', () => {
      expect(whenObtengoTodosLosTimeSlotIds()).toEqual(['ts-001', 'ts-002', 'ts-003', 'ts-004']);
    });
  });

  function whenObtengoTodosLosTimeSlotIds(): string[] {
    return service.obtenerTodosLosTimeSlotIds();
  }

  function thenElRecreoMapeaA(recreo: Recreo, expected: string): void {
    expect(service.recreoATimeSlotId(recreo)).toBe(expected);
  }

  function thenElTimeSlotMapeaA(timeSlotId: string, expected: Recreo | null): void {
    expect(service.timeSlotIdARecrea(timeSlotId)).toBe(expected);
  }
});
