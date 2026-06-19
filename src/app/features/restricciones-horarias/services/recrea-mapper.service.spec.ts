import { TestBed } from '@angular/core/testing';
import { RecreaMapperService } from './recrea-mapper.service';

describe('RecreaMapperService', () => {
  let service: RecreaMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecreaMapperService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('dado que pido recreoATimeSlotId, deberia devolver el id correcto', () => {
    expect(service.recreoATimeSlotId('PRIMER_RECREO')).toBe('ts-001');
    expect(service.recreoATimeSlotId('MEDIODIA')).toBe('ts-003');
  });

  it('dado que pido timeSlotIdARecrea, deberia devolver el recreo correcto', () => {
    expect(service.timeSlotIdARecrea('ts-002')).toBe('SEGUNDO_RECREO');
    expect(service.timeSlotIdARecrea('ts-004')).toBe('FUERA_HORA');
  });

  it('dado que pido timeSlotIdARecrea con un id invalido, deberia devolver null', () => {
    expect(service.timeSlotIdARecrea('ts-005')).toBeNull();
  });

  it('dado que pido todos los ids, deberia devolver la lista de ids', () => {
    const ids = service.obtenerTodosLosTimeSlotIds();
    expect(ids).toContain('ts-001');
    expect(ids.length).toBe(4);
  });
});
