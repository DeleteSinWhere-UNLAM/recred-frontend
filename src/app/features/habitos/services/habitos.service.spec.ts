import { TestBed } from '@angular/core/testing';

import { HabitosService } from './habitos.service';

describe('HabitosService', () => {

  let service: HabitosService;

  beforeEach(() => {

    TestBed.configureTestingModule({});

    service = TestBed.inject(HabitosService);

  });

  it('debería devolver alertas', () => {

    const data = service.getAlertas();

    expect(data.length).toBeGreaterThan(0);

  });

  it('debería contener a Julián García', () => {

    const data = service.getAlertas();

    expect(
      data.some(a => a.alumno === 'Julián García')
    ).toBeTrue();

  });

  it('debería contener categoría Golosinas', () => {

    const data = service.getAlertas();

    expect(
      data.some(a => a.categoria === 'Golosinas')
    ).toBeTrue();

  });

  it('debería tener porcentajes de gasto válidos', () => {

    const data = service.getAlertas();

    expect(
      data.every(a => a.porcentajeGasto > 0)
    ).toBeTrue();

  });

  it('debería tener mensajes de alerta', () => {

    const data = service.getAlertas();

    expect(
      data.every(a => a.mensaje.length > 0)
    ).toBeTrue();

  });

});