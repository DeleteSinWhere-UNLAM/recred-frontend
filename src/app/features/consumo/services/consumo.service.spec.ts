import { TestBed } from '@angular/core/testing';

import { ConsumoService } from './consumo.service';

describe('ConsumoService', () => {

  let service: ConsumoService;

  beforeEach(() => {

    TestBed.configureTestingModule({});

    service = TestBed.inject(ConsumoService);

  });

  it('debería devolver consumos', () => {

    const data = service.getConsumos();

    expect(data.length).toBeGreaterThan(0);

  });

  it('debería contener a Julián García', () => {

    const data = service.getConsumos();

    expect(
      data.some(c => c.alumno === 'Julián García')
    ).toBeTrue();

  });

  it('debería contener productos frecuentes', () => {

    const data = service.getConsumos();

    expect(
      data.some(c => c.productoFrecuente === 'Jugo')
    ).toBeTrue();

    expect(
      data.some(c => c.productoFrecuente === 'Tostado')
    ).toBeTrue();

  });

  it('debería tener recomendaciones IA', () => {

    const data = service.getConsumos();

    expect(
      data.every(c => c.recomendacion.length > 0)
    ).toBeTrue();

  });

});