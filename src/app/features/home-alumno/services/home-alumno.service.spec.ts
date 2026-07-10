import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { Movimiento } from '../../movimientos/models/movimiento.model';
import { MovimientosService } from '../../movimientos/services/movimientos.service';
import { FranjasHorariasService } from '../../restricciones-horarias/services/franjas-horarias.service';
import { HomeAlumnoService } from './home-alumno.service';
import { FranjaHorariaMother, MovimientoPendienteMother } from '../home-alumno.mother';

describe('HomeAlumnoService', () => {
  let service: HomeAlumnoService;
  let servicioMovimientos: jasmine.SpyObj<MovimientosService>;
  let servicioFranjas: jasmine.SpyObj<FranjasHorariasService>;

  const COLEGIO_ID = 'col-1';
  const ALUMNO_ID = 'alumno-1';

  beforeEach(() => {
    servicioMovimientos = jasmine.createSpyObj('MovimientosService', ['getPendientesAlumno']);
    servicioFranjas = jasmine.createSpyObj('FranjasHorariasService', ['getFranjasHorarias']);
    servicioFranjas.getFranjasHorarias.and.resolveTo(FranjaHorariaMother.crearListaDelColegio());

    TestBed.configureTestingModule({
      providers: [
        HomeAlumnoService,
        { provide: MovimientosService, useValue: servicioMovimientos },
        { provide: FranjasHorariasService, useValue: servicioFranjas },
        provideHttpClient(),
        provideHttpClientTesting()
      ],
    });
    service = TestBed.inject(HomeAlumnoService);
  });

  it('dado que se inyecta el servicio, deberia crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('dado que no se cargo nada, cuando consulto el pedido en curso, deberia devolver undefined', () => {
    expect(service.getPedidoEnCurso(ALUMNO_ID)).toBeUndefined();
  });

  it('dado un pendiente del alumno, cuando cargo el pedido en curso, deberia mapearlo correctamente', async () => {
    givenPendientesDelAlumno([MovimientoPendienteMother.crear()]);

    await whenCargoPedidoEnCurso(ALUMNO_ID);

    const pedido = service.getPedidoEnCurso(ALUMNO_ID);
    expect(pedido?.id).toBe('compra-1');
    expect(pedido?.estado).toBe('PREPARANDO');
    expect(pedido?.retiraEn).toBe('10:30');
    expect(pedido?.itemsResumen).toEqual(['Sándwich JyQ', '2x Jugo']);
  });

  it('dados varios pendientes, cuando cargo el pedido en curso, deberia elegir el de fecha mas reciente', async () => {
    const viejo = MovimientoPendienteMother.crear({
      id: 'compra-vieja',
      status: 'PENDIENTE',
      date: '2024-01-01T08:00:00',
      items: [],
      pickupDate: '2024-01-01',
      pickupSlotStartTime: undefined,
    });
    const nuevo = MovimientoPendienteMother.crear({
      id: 'compra-nueva',
      totalAmount: 2000,
      status: 'PENDIENTE',
      date: '2026-06-27T10:00:00',
      items: [{ productId: 'p1', productName: 'Medialunas', quantity: 2, unitPrice: 500 }],
      pickupDate: '2026-06-27',
      pickupSlotStartTime: '09:30',
    });
    givenPendientesDelAlumno([viejo, nuevo]);

    await whenCargoPedidoEnCurso(ALUMNO_ID);

    const pedido = service.getPedidoEnCurso(ALUMNO_ID);
    expect(pedido?.id).toBe('compra-nueva');
    expect(pedido?.estado).toBe('CONFIRMADO');
    expect(pedido?.retiraEn).toBe('09:30');
    expect(pedido?.itemsResumen).toEqual(['2x Medialunas']);
  });

  it('dado que el endpoint de pendientes falla, cuando cargo el pedido en curso, deberia dejar el pedido en undefined', async () => {
    givenQueElEndpointDePendientesFalla();

    await whenCargoPedidoEnCurso(ALUMNO_ID);

    expect(service.getPedidoEnCurso(ALUMNO_ID)).toBeUndefined();
  });

  it('dado que no se cargaron recreos, cuando consulto el proximo recreo, deberia devolver undefined', () => {
    expect(service.getProximoRecreo(COLEGIO_ID)).toBeUndefined();
  });

  it('dado un colegioId undefined, cuando consulto el proximo recreo, deberia devolver undefined', async () => {
    await whenCargoRecreos(COLEGIO_ID);

    expect(service.getProximoRecreo(undefined)).toBeUndefined();
  });

  it('dado que cargo los recreos del colegio, cuando consulto antes del primero, deberia devolver el primero', async () => {
    await whenCargoRecreos(COLEGIO_ID);

    const antesDelPrimero = new Date(2026, 5, 22, 8, 0);
    expect(service.getProximoRecreo(COLEGIO_ID, antesDelPrimero)?.nombre).toBe('Primer recreo');
  });

  it('dado que estoy en la mitad del segundo recreo, cuando consulto el proximo, deberia seguir devolviendo el segundo', async () => {
    await whenCargoRecreos(COLEGIO_ID);

    const enMediaDelSegundo = new Date(2026, 5, 22, 11, 35);
    expect(service.getProximoRecreo(COLEGIO_ID, enMediaDelSegundo)?.nombre).toBe('Segundo recreo');
  });

  it('dado que el primer recreo termino, cuando consulto el proximo, deberia saltar al siguiente', async () => {
    await whenCargoRecreos(COLEGIO_ID);

    const despuesDelPrimero = new Date(2026, 5, 22, 10, 45);
    expect(service.getProximoRecreo(COLEGIO_ID, despuesDelPrimero)?.nombre).toBe('Segundo recreo');
  });

  it('dado que ya pasaron todos los recreos, cuando consulto el proximo, deberia devolver undefined', async () => {
    await whenCargoRecreos(COLEGIO_ID);

    const finDeJornada = new Date(2026, 5, 22, 18, 0);
    expect(service.getProximoRecreo(COLEGIO_ID, finDeJornada)).toBeUndefined();
  });

  it('dado que el endpoint de franjas falla, cuando cargo recreos, deberia dejar la lista vacia', async () => {
    givenQueElEndpointDeFranjasFalla();

    await whenCargoRecreos(COLEGIO_ID);

    expect(service.getProximoRecreo(COLEGIO_ID, new Date(2026, 5, 22, 8, 0))).toBeUndefined();
  });

  it('dado alumnoId vacio en cargarPedidoEnCurso, no deberia llamar al service de movimientos', async () => {
    await service.cargarPedidoEnCurso('');

    expect(servicioMovimientos.getPendientesAlumno).not.toHaveBeenCalled();
  });

  it('dado colegioId vacio en cargarRecreos, no deberia llamar al service de franjas', async () => {
    servicioFranjas.getFranjasHorarias.calls.reset();

    await service.cargarRecreos('');

    expect(servicioFranjas.getFranjasHorarias).not.toHaveBeenCalled();
  });

  it('dado un movimiento con status desconocido, deberia mapear el estado a CONFIRMADO por default', async () => {
    givenPendientesDelAlumno([
      MovimientoPendienteMother.crear({ status: 'STATUS_RARO' }),
    ]);

    await whenCargoPedidoEnCurso(ALUMNO_ID);

    expect(service.getPedidoEnCurso(ALUMNO_ID)?.estado).toBe('CONFIRMADO');
  });

  it('dado un movimiento sin pickupSlotStartTime pero con pickupSlotDescription, retiraEn deberia usar la descripcion', async () => {
    givenPendientesDelAlumno([
      MovimientoPendienteMother.crear({
        pickupSlotStartTime: undefined,
        pickupSlotDescription: 'Primer recreo',
      }),
    ]);

    await whenCargoPedidoEnCurso(ALUMNO_ID);

    expect(service.getPedidoEnCurso(ALUMNO_ID)?.retiraEn).toBe('Primer recreo');
  });

  it('dado un movimiento con solo date, retiraEn deberia formatearlo como HH:mm', async () => {
    givenPendientesDelAlumno([
      MovimientoPendienteMother.crear({
        pickupSlotStartTime: undefined,
        pickupSlotDescription: undefined,
        date: '2026-06-15T14:23:00',
      }),
    ]);

    await whenCargoPedidoEnCurso(ALUMNO_ID);

    expect(service.getPedidoEnCurso(ALUMNO_ID)?.retiraEn).toBe('14:23');
  });

  it('dado un movimiento sin date ni pickup, retiraEn deberia ser ""', async () => {
    givenPendientesDelAlumno([
      MovimientoPendienteMother.crear({
        pickupSlotStartTime: undefined,
        pickupSlotDescription: undefined,
        date: '',
      }),
    ]);

    await whenCargoPedidoEnCurso(ALUMNO_ID);

    expect(service.getPedidoEnCurso(ALUMNO_ID)?.retiraEn).toBe('');
  });

  it('dado que el back devuelve lista vacia, cuando cargo pedido en curso, deberia quedar en null', async () => {
    givenPendientesDelAlumno([]);

    await whenCargoPedidoEnCurso(ALUMNO_ID);

    expect(service.getPedidoEnCurso(ALUMNO_ID)).toBeUndefined();
  });

  it('dado un movimiento sin date pero con pickupDate, deberia usar pickupDate para el orden', async () => {
    const soloConPickup = MovimientoPendienteMother.crear({
      id: 'con-pickup',
      status: 'PENDIENTE',
      date: undefined as unknown as string,
      pickupDate: '2026-06-27',
    });
    givenPendientesDelAlumno([soloConPickup]);

    await whenCargoPedidoEnCurso(ALUMNO_ID);

    expect(service.getPedidoEnCurso(ALUMNO_ID)?.id).toBe('con-pickup');
  });

  it('dado dos movimientos, uno solo con pickupDate y otro con date, deberia ordenarlos usando esa fecha', async () => {
    const soloConPickup = MovimientoPendienteMother.crear({
      id: 'con-pickup',
      status: 'PENDIENTE',
      date: undefined as unknown as string,
      pickupDate: '2026-06-20',
    });
    const conDate = MovimientoPendienteMother.crear({
      id: 'con-date',
      status: 'PENDIENTE',
      date: '2026-06-27T10:00:00',
    });
    givenPendientesDelAlumno([soloConPickup, conDate]);

    await whenCargoPedidoEnCurso(ALUMNO_ID);

    expect(service.getPedidoEnCurso(ALUMNO_ID)?.id).toBe('con-date');
  });

  it('dado un movimiento sin date ni pickupDate, elegirUltimoPedido deberia usar 0 como timestamp fallback', async () => {
    const invalido = MovimientoPendienteMother.crear({
      id: 'sin-fecha',
      status: 'PENDIENTE',
      date: undefined as unknown as string,
      pickupDate: undefined,
    });
    givenPendientesDelAlumno([invalido]);

    await whenCargoPedidoEnCurso(ALUMNO_ID);

    expect(service.getPedidoEnCurso(ALUMNO_ID)?.id).toBe('sin-fecha');
  });

  it('dado dos movimientos donde uno no tiene fecha, el ordenamiento no deberia romper y el que tiene fecha valida deberia quedar primero', async () => {
    const invalido = MovimientoPendienteMother.crear({
      id: 'sin-fecha',
      status: 'PENDIENTE',
      date: undefined as unknown as string,
      pickupDate: undefined,
    });
    const conFecha = MovimientoPendienteMother.crear({
      id: 'con-fecha',
      status: 'PENDIENTE',
      date: '2026-06-27T10:00:00',
    });
    givenPendientesDelAlumno([invalido, conFecha]);

    await whenCargoPedidoEnCurso(ALUMNO_ID);

    expect(service.getPedidoEnCurso(ALUMNO_ID)?.id).toBe('con-fecha');
  });

  it('dado un movimiento sin status, deberia mapear a CONFIRMADO por default', async () => {
    givenPendientesDelAlumno([
      MovimientoPendienteMother.crear({ status: undefined as unknown as string }),
    ]);

    await whenCargoPedidoEnCurso(ALUMNO_ID);

    expect(service.getPedidoEnCurso(ALUMNO_ID)?.estado).toBe('CONFIRMADO');
  });

  it('dado un movimiento sin totalAmount, totalFormateado deberia usar 0', async () => {
    givenPendientesDelAlumno([
      MovimientoPendienteMother.crear({ totalAmount: undefined as unknown as number }),
    ]);

    await whenCargoPedidoEnCurso(ALUMNO_ID);

    const pedido = service.getPedidoEnCurso(ALUMNO_ID);
    expect(pedido?.totalFormateado).toContain('0');
  });

  function givenPendientesDelAlumno(pendientes: Movimiento[]): void {
    servicioMovimientos.getPendientesAlumno.and.returnValue(of(pendientes));
  }

  function givenQueElEndpointDePendientesFalla(): void {
    servicioMovimientos.getPendientesAlumno.and.returnValue(throwError(() => new Error('500')));
  }

  function givenQueElEndpointDeFranjasFalla(): void {
    servicioFranjas.getFranjasHorarias.and.rejectWith(new Error('500'));
  }

  function whenCargoPedidoEnCurso(alumnoId: string): Promise<void> {
    return service.cargarPedidoEnCurso(alumnoId);
  }

  function whenCargoRecreos(colegioId: string): Promise<void> {
    return service.cargarRecreos(colegioId);
  }
});
