import { TestBed } from '@angular/core/testing';
import { PreferenciasService } from './preferencias.service';

describe('PreferenciasService', () => {
  let service: PreferenciasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreferenciasService);
  });

  it('debería devolver las preferencias del usuario', () => {
    const data = service.getPreferencias();

    expect(data.length).toBeGreaterThan(0);
  });

  it('debería tener producto Agua', () => {
    const data = service.getPreferencias();

    expect(data.some(p => p.producto === 'Agua')).toBeTrue();
  });

it('debería separar correctamente disponibles y no disponibles', () => {
  const data = service.getPreferencias();

  const disponibles = data.filter(p => p.disponible);
  const noDisponibles = data.filter(p => !p.disponible);

  expect(disponibles.every(p => p.disponible)).toBeTrue();
  expect(noDisponibles.every(p => !p.disponible)).toBeTrue();
});

  it('debería tener estructura válida en cada preferencia', () => {
    const data = service.getPreferencias();

    const esValido = data.every(p =>
      typeof p.producto === 'string' &&
      typeof p.score === 'number' &&
      typeof p.disponible === 'boolean'
    );

    expect(esValido).toBeTrue();
  });
});