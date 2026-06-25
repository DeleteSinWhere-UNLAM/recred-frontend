import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Movimiento } from '../../movimientos/models/movimiento.model';
import { MovimientosService } from '../../movimientos/services/movimientos.service';
import { FranjasHorariasService } from '../../restricciones-horarias/services/franjas-horarias.service';
import { TimeSlot } from '../../restricciones-horarias/models/restriccion-horaria.model';
import { HomeAlumnoService } from './home-alumno.service';

describe('HomeAlumnoService', () => {
  let service: HomeAlumnoService;
  let movimientosServiceSpy: jasmine.SpyObj<MovimientosService>;
  let franjasServiceSpy: jasmine.SpyObj<FranjasHorariasService>;

  const hoyISO = new Date().toISOString().slice(0, 10);

  const franjasMock: TimeSlot[] = [
    { id: '1', colegioId: 'col-1', descripcion: 'Primer recreo', horaInicio: '10:15:00', horaFin: '10:30:00', activo: true },
    { id: '2', colegioId: 'col-1', descripcion: 'Mediodia',      horaInicio: '13:00:00', horaFin: '13:30:00', activo: true },
    { id: '3', colegioId: 'col-1', descripcion: 'Segundo recreo', horaInicio: '11:30:00', horaFin: '11:50:00', activo: true },
    { id: '4', colegioId: 'col-1', descripcion: 'Recreo viejo',   horaInicio: '09:00:00', horaFin: '09:10:00', activo: false },
  ];

  beforeEach(() => {
    movimientosServiceSpy = jasmine.createSpyObj('MovimientosService', [
      'getPendientesAlumno',
    ]);
    franjasServiceSpy = jasmine.createSpyObj('FranjasHorariasService', [
      'getFranjasHorarias',
    ]);
    franjasServiceSpy.getFranjasHorarias.and.resolveTo(franjasMock);

    TestBed.configureTestingModule({
      providers: [
        HomeAlumnoService,
        { provide: MovimientosService, useValue: movimientosServiceSpy },
        { provide: FranjasHorariasService, useValue: franjasServiceSpy },
      ],
    });
    service = TestBed.inject(HomeAlumnoService);
  });

  it('debería crearse', () => {
    expect(service).toBeTruthy();
  });

  it('debería devolver undefined si no se cargó pedido', () => {
    expect(service.getPedidoEnCurso('alumno-1')).toBeUndefined();
  });

  it('debería cargar y mapear el pendiente más reciente', async () => {
    const movimientos: Movimiento[] = [
      {
        id: 'compra-1',
        studentId: 'alumno-1',
        totalAmount: 1950,
        status: 'EN_PREPARACION',
        statusLabel: 'En preparacion',
        paymentMethod: 'DEBIT',
        date: `${hoyISO}T08:00:00`,
        items: [
          { productId: 'p1', productName: 'Sándwich JyQ', quantity: 1, unitPrice: 1500 },
          { productId: 'p2', productName: 'Jugo', quantity: 2, unitPrice: 225 },
        ],
        tipo: 'ANTICIPADA',
        pickupDate: hoyISO,
        pickupSlotStartTime: '10:30',
      },
    ];
    movimientosServiceSpy.getPendientesAlumno.and.returnValue(of(movimientos));

    await service.cargarPedidoEnCurso('alumno-1');

    const pedido = service.getPedidoEnCurso('alumno-1');
    expect(pedido).toBeDefined();
    expect(pedido?.id).toBe('compra-1');
    expect(pedido?.estado).toBe('PREPARANDO');
    expect(pedido?.retiraEn).toBe('10:30');
    expect(pedido?.itemsResumen).toEqual(['Sándwich JyQ', '2x Jugo']);
  });

  it('debería elegir el pendiente con fecha más reciente aunque no sea de hoy', async () => {
    const movimientos: Movimiento[] = [
      {
        id: 'compra-vieja',
        studentId: 'alumno-1',
        totalAmount: 1000,
        status: 'PENDIENTE',
        statusLabel: 'A preparar',
        paymentMethod: 'DEBIT',
        date: '2024-01-01T08:00:00',
        items: [],
        tipo: 'ANTICIPADA',
        pickupDate: '2024-01-01',
      },
      {
        id: 'compra-nueva',
        studentId: 'alumno-1',
        totalAmount: 2000,
        status: 'PENDIENTE',
        statusLabel: 'A preparar',
        paymentMethod: 'DEBIT',
        date: '2026-06-27T10:00:00',
        items: [
          { productId: 'p1', productName: 'Medialunas', quantity: 2, unitPrice: 500 },
        ],
        tipo: 'ANTICIPADA',
        pickupDate: '2026-06-27',
        pickupSlotStartTime: '09:30',
      },
    ];
    movimientosServiceSpy.getPendientesAlumno.and.returnValue(of(movimientos));

    await service.cargarPedidoEnCurso('alumno-1');

    const pedido = service.getPedidoEnCurso('alumno-1');
    expect(pedido?.id).toBe('compra-nueva');
    expect(pedido?.estado).toBe('CONFIRMADO');
    expect(pedido?.retiraEn).toBe('09:30');
    expect(pedido?.itemsResumen).toEqual(['2x Medialunas']);
  });

  it('debería dejar el pedido nulo si falla el endpoint', async () => {
    movimientosServiceSpy.getPendientesAlumno.and.returnValue(
      throwError(() => new Error('500')),
    );

    await service.cargarPedidoEnCurso('alumno-1');

    expect(service.getPedidoEnCurso('alumno-1')).toBeUndefined();
  });

  it('debería devolver undefined si todavía no se cargaron los recreos del colegio', () => {
    expect(service.getProximoRecreo('col-1')).toBeUndefined();
  });

  it('debería devolver undefined si no se pasó colegioId', async () => {
    await service.cargarRecreos('col-1');
    expect(service.getProximoRecreo(undefined)).toBeUndefined();
  });

  it('debería cargar recreos del colegio filtrando no-recreos e inactivos', async () => {
    await service.cargarRecreos('col-1');

    const antesDelPrimero = new Date(2026, 5, 22, 8, 0);
    expect(service.getProximoRecreo('col-1', antesDelPrimero)?.nombre).toBe('Primer recreo');
  });

  it('debería seguir devolviendo el recreo en curso hasta que termine', async () => {
    await service.cargarRecreos('col-1');

    const enMediaDelSegundo = new Date(2026, 5, 22, 11, 35);
    expect(service.getProximoRecreo('col-1', enMediaDelSegundo)?.nombre).toBe('Segundo recreo');
  });

  it('debería saltear al siguiente recreo cuando el anterior ya terminó', async () => {
    await service.cargarRecreos('col-1');

    const despuesDelPrimero = new Date(2026, 5, 22, 10, 45);
    expect(service.getProximoRecreo('col-1', despuesDelPrimero)?.nombre).toBe('Segundo recreo');
  });

  it('debería devolver undefined si ya pasaron todos los recreos del día', async () => {
    await service.cargarRecreos('col-1');

    const finDeJornada = new Date(2026, 5, 22, 18, 0);
    expect(service.getProximoRecreo('col-1', finDeJornada)).toBeUndefined();
  });

  it('debería dejar la lista vacía si el endpoint de franjas falla', async () => {
    franjasServiceSpy.getFranjasHorarias.and.rejectWith(new Error('500'));

    await service.cargarRecreos('col-1');

    expect(service.getProximoRecreo('col-1', new Date(2026, 5, 22, 8, 0))).toBeUndefined();
  });
});
