import { TestBed } from '@angular/core/testing';
import { HabitosService } from './habitos.service';

describe('HabitosService', () => {
  let service: HabitosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HabitosService);
  });

  describe('getAlertas', () => {
    it('dado el service recien inyectado, cuando pido las alertas, deberia devolver al menos una', () => {
      const alertas = whenPidoAlertas();

      expect(alertas.length).toBeGreaterThan(0);
    });

    it('dado el catalogo mockeado, deberia incluir a Julián García', () => {
      const alertas = whenPidoAlertas();

      expect(alertas.some((a) => a.alumno === 'Julián García')).toBeTrue();
    });

    it('dado el catalogo mockeado, deberia incluir la categoria Golosinas', () => {
      const alertas = whenPidoAlertas();

      expect(alertas.some((a) => a.categoria === 'Golosinas')).toBeTrue();
    });

    it('dado cada alerta, el porcentaje de gasto deberia ser mayor a 0', () => {
      const alertas = whenPidoAlertas();

      expect(alertas.every((a) => a.porcentajeGasto > 0)).toBeTrue();
    });

    it('dado cada alerta, el mensaje no deberia estar vacio', () => {
      const alertas = whenPidoAlertas();

      expect(alertas.every((a) => a.mensaje.length > 0)).toBeTrue();
    });
  });

  function whenPidoAlertas() {
    return service.getAlertas();
  }
});
