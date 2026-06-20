import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { PresupuestoPage } from './presupuesto.page';
import { PresupuestoPresenter } from './presenter/presupuesto.presenter';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { CambioPorcentaje } from './components/regla-categoria-item/regla-categoria-item.component';

describe('PresupuestoPage', () => {
  let component: PresupuestoPage;
  let fixture: ComponentFixture<PresupuestoPage>;
  let mockPresenter: jasmine.SpyObj<PresupuestoPresenter>;

  beforeEach(async () => {
    mockPresenter = jasmine.createSpyObj('PresupuestoPresenter', [
      'init', 'setMontoGeneral', 'setPeriodo', 'setFechaInicio',
      'agregarReglaCategoria', 'setPorcentajeRegla', 'eliminarRegla', 'guardar', 'volver'
    ]);
    
    // Asignar señales
    Object.assign(mockPresenter, {
      cargando: signal(false),
      guardando: signal(false),
      alumno: signal(undefined),
      presupuesto: signal({ reglasCategoria: [], montoLimiteGeneral: 0, periodo: 'MENSUAL', fechaInicio: '' }),
      prediccion: signal(undefined),
      categoriasDisponibles: signal([]),
      nombreCompleto: signal(''),
      grado: signal(''),
      urlFotoPerfil: signal(null),
      iniciales: signal(''),
      reglas: signal([]),
      totalPorcentaje: signal(0),
      porcentajeValido: signal(true),
      nivelAlerta: signal('ok'),
      categoriasUsables: signal([]),
      puedeAgregarRegla: signal(true),
      topeCompletado: signal(false),
      periodos: ['DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL']
    });

    await TestBed.configureTestingModule({
      imports: [PresupuestoPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' } } } },
        { 
          provide: UsuarioService, 
          useValue: {  
            homeUrl: jasmine.createSpy('homeUrl').and.returnValue('/'), 
            nombreNavbar: signal('Test'), 
            esVistaAlumno: signal(false), 
            esVistaKiosquero: signal(false),  
            getUsuarioActual: () => ({ nombre: 'Test' }) , 
            setNombreNavbar: jasmine.createSpy('setNombreNavbar')
          } 
        }
      ]
    })
    .overrideComponent(PresupuestoPage, {
      set: {
        template: '',
        providers: [
          { provide: PresupuestoPresenter, useValue: mockPresenter }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(PresupuestoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se inicializa, debe crearse correctamente y llamar a init', () => {
    expect(component).toBeTruthy();
    expect(mockPresenter.init).toHaveBeenCalledWith('123');
  });

  it('dado que no hay id de alumno en la ruta deberia iniciar con string vacio', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PresupuestoPage, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { 
          provide: UsuarioService, 
          useValue: {  
            getUsuarioActual: () => ({ nombre: 'Test' }),
            esVistaKiosquero: signal(false)
          } 
        }
      ]
    })
    .overrideComponent(PresupuestoPage, {
      set: {
        template: '',
        providers: [
          { provide: PresupuestoPresenter, useValue: mockPresenter }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }
    });
    const newFixture = TestBed.createComponent(PresupuestoPage);
    newFixture.detectChanges();
    expect(mockPresenter.init).toHaveBeenCalledWith('');
  });

  describe('Metodos protegidos de la vista', () => {
    it('etiquetaPeriodo deberia devolver la etiqueta correcta', () => {
      const comp = component as any;
      expect(comp.etiquetaPeriodo('DIARIO')).toBe('Diario');
      expect(comp.etiquetaPeriodo('SEMANAL')).toBe('Semanal');
      expect(comp.etiquetaPeriodo('QUINCENAL')).toBe('Quincenal');
      expect(comp.etiquetaPeriodo('MENSUAL')).toBe('Mensual');
    });

    it('onMontoChange deberia delegar a setMontoGeneral', () => {
      const e = { target: { value: '5000' } } as unknown as Event;
      (component as any).onMontoChange(e);
      expect(mockPresenter.setMontoGeneral).toHaveBeenCalledWith(5000);
    });

    it('onPeriodoChange deberia delegar a setPeriodo', () => {
      const e = { target: { value: 'SEMANAL' } } as unknown as Event;
      (component as any).onPeriodoChange(e);
      expect(mockPresenter.setPeriodo).toHaveBeenCalledWith('SEMANAL');
    });

    it('onFechaChange deberia delegar a setFechaInicio', () => {
      const e = { target: { value: '2024-01-01' } } as unknown as Event;
      (component as any).onFechaChange(e);
      expect(mockPresenter.setFechaInicio).toHaveBeenCalledWith('2024-01-01');
    });

    it('onAgregarRegla deberia ignorar si el valor es vacio', () => {
      const e = { target: { value: '' } } as unknown as Event;
      (component as any).onAgregarRegla(e);
      expect(mockPresenter.agregarReglaCategoria).not.toHaveBeenCalled();
    });

    it('onAgregarRegla deberia delegar a agregarReglaCategoria y limpiar el target', () => {
      const target = { value: 'cat-1' };
      const e = { target } as unknown as Event;
      (component as any).onAgregarRegla(e);
      expect(mockPresenter.agregarReglaCategoria).toHaveBeenCalledWith('cat-1');
      expect(target.value).toBe('');
    });

    it('onPorcentajeChange deberia delegar a setPorcentajeRegla', () => {
      const cambio: CambioPorcentaje = { reglaId: 'r-1', porcentaje: 25 };
      (component as any).onPorcentajeChange(cambio);
      expect(mockPresenter.setPorcentajeRegla).toHaveBeenCalledWith('r-1', 25);
    });

    it('onEliminarRegla deberia delegar a eliminarRegla', () => {
      (component as any).onEliminarRegla('r-2');
      expect(mockPresenter.eliminarRegla).toHaveBeenCalledWith('r-2');
    });

    it('totalPorcentajeAcotado deberia devolver el minimo entre el total y 100', () => {
      (mockPresenter as any).totalPorcentaje = signal(80);
      expect((component as any).totalPorcentajeAcotado).toBe(80);

      (mockPresenter as any).totalPorcentaje = signal(120);
      expect((component as any).totalPorcentajeAcotado).toBe(100);
    });
  });
});
