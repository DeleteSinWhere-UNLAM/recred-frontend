import { TestBed } from '@angular/core/testing';
import { ConsumoService } from './consumo.service';

describe('ConsumoService', () => {
  let service: ConsumoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsumoService);
  });

  describe('getConsumos', () => {
    it('dado el service recien inyectado, cuando pido los consumos, deberia devolver al menos un aprendizaje', () => {
      const consumos = whenPidoConsumos();

      expect(consumos.length).toBeGreaterThan(0);
    });

    it('dado el catalogo mockeado, cuando pido los consumos, deberia incluir a Julián García', () => {
      const consumos = whenPidoConsumos();

      expect(consumos.some((c) => c.alumno === 'Julián García')).toBeTrue();
    });

    it('dado el catalogo mockeado, cuando pido los consumos, deberia incluir Jugo y Tostado como productos frecuentes', () => {
      const consumos = whenPidoConsumos();

      const frecuentes = consumos.map((c) => c.productoFrecuente);
      expect(frecuentes).toContain('Jugo');
      expect(frecuentes).toContain('Tostado');
    });

    it('dado cada aprendizaje, deberia venir con una recomendacion no vacia', () => {
      const consumos = whenPidoConsumos();

      expect(consumos.every((c) => c.recomendacion.length > 0)).toBeTrue();
    });
  });

  function whenPidoConsumos() {
    return service.getConsumos();
  }
});
