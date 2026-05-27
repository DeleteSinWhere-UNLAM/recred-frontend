import { TestBed } from '@angular/core/testing';

import { SugerenciasService } from './sugerencias.service';

describe('SugerenciasService', () => {

  let service: SugerenciasService;

  beforeEach(() => {

    TestBed.configureTestingModule({});

    service = TestBed.inject(SugerenciasService);

  });

  it('debería devolver sugerencias', () => {

    const data = service.getSugerencias();

    expect(data.length).toBeGreaterThan(0);

  });

  it('debería contener producto original Gaseosa', () => {

    const data = service.getSugerencias();

    expect(
      data.some(s => s.productoOriginal === 'Gaseosa')
    ).toBeTrue();

  });

  it('debería contener productos sugeridos', () => {

    const data = service.getSugerencias();

    expect(
      data.some(s => s.productoSugerido === 'Jugo')
    ).toBeTrue();

    expect(
      data.some(s => s.productoSugerido === 'Barra de cereal')
    ).toBeTrue();

  });

  it('debería tener motivos de sugerencia', () => {

    const data = service.getSugerencias();

    expect(
      data.every(s => s.motivo.length > 0)
    ).toBeTrue();

  });

  it('debería identificar productos bloqueados', () => {

    const data = service.getSugerencias();

    const bloqueados =
      data.filter(s => s.bloqueado);

    expect(
      bloqueados.length
    ).toBeGreaterThan(0);

  });

});