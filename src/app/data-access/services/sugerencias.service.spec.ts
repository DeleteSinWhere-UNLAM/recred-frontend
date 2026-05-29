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

  it('debería contener producto original', () => {
    const data = service.getSugerencias();

    expect(
      data.some(s => s.productoOriginal.length > 0)
    ).toBeTrue();
  });

  it('debería tener productos sugeridos', () => {
    const data = service.getSugerencias();

    expect(
      data.some(s => s.productosSugeridos.length > 0)
    ).toBeTrue();
  });

  it('debería tener resumen y motivo IA', () => {
    const data = service.getSugerencias();

    expect(
      data.every(s =>
        s.resumen.length > 0 &&
        s.motivoIA.length > 0
      )
    ).toBeTrue();
  });

  it('debería tener modelo IA definido', () => {
    const data = service.getSugerencias();

    expect(
      data.every(s => s.modeloIA.includes('gemini'))
    ).toBeTrue();
  });

});