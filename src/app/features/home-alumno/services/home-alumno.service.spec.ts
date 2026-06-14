import { TestBed } from '@angular/core/testing';
import { HomeAlumnoService } from './home-alumno.service';

describe('HomeAlumnoService', () => {
  let service: HomeAlumnoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HomeAlumnoService]
    });
    service = TestBed.inject(HomeAlumnoService);
  });

  it('debería crearse', () => {
    expect(service).toBeTruthy();
  });

  it('debería devolver pedido en curso del mock', () => {
    const pedido = service.getPedidoEnCurso('julian-garcia');
    expect(pedido).toBeDefined();
    expect(pedido?.id).toBe('ped-001');
    
    const pedidoInexistente = service.getPedidoEnCurso('alumno-inexistente');
    expect(pedidoInexistente).toBeUndefined();
  });

  it('debería devolver próximo recreo del mock', () => {
    const recreo = service.getProximoRecreo('julian-garcia');
    expect(recreo).toBeDefined();
    expect(recreo?.nombre).toBe('Recreo largo');
    
    const recreoInexistente = service.getProximoRecreo('alumno-inexistente');
    expect(recreoInexistente).toBeUndefined();
  });
});
