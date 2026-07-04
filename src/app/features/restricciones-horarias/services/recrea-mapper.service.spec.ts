import { TestBed } from '@angular/core/testing';
import { RecreaMapperService } from './recrea-mapper.service';

describe('RecreaMapperService', () => {
  let service: RecreaMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [RecreaMapperService] });
    service = TestBed.inject(RecreaMapperService);
  });

  describe('recreoATimeSlotId', () => {
    it('dado PRIMER_RECREO, cuando mapeo, deberia devolver ts-001', () => {
      expect(service.recreoATimeSlotId('PRIMER_RECREO')).toBe('ts-001');
    });

    it('dado SEGUNDO_RECREO, cuando mapeo, deberia devolver ts-002', () => {
      expect(service.recreoATimeSlotId('SEGUNDO_RECREO')).toBe('ts-002');
    });

    it('dado MEDIODIA, cuando mapeo, deberia devolver ts-003', () => {
      expect(service.recreoATimeSlotId('MEDIODIA')).toBe('ts-003');
    });

    it('dado FUERA_HORA, cuando mapeo, deberia devolver ts-004', () => {
      expect(service.recreoATimeSlotId('FUERA_HORA')).toBe('ts-004');
    });
  });

  describe('timeSlotIdARecrea', () => {
    it('dado ts-001, cuando mapeo, deberia devolver PRIMER_RECREO', () => {
      expect(service.timeSlotIdARecrea('ts-001')).toBe('PRIMER_RECREO');
    });

    it('dado un timeSlotId desconocido, cuando mapeo, deberia devolver null', () => {
      expect(service.timeSlotIdARecrea('ts-inexistente')).toBeNull();
    });
  });

  describe('obtenerTodosLosTimeSlotIds', () => {
    it('cuando pido todos los ids, deberia devolver los cuatro time slots', () => {
      expect(service.obtenerTodosLosTimeSlotIds()).toEqual(['ts-001', 'ts-002', 'ts-003', 'ts-004']);
    });
  });
});
