import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { AlumnoMother } from '../../data-access/services/alumno.mother';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ToastService } from '../../shared/services/toast.service';
import { ReglaCategoriaItemComponent } from './components/regla-categoria-item/regla-categoria-item.component';
import { ReglaCategoria } from './models/presupuesto.model';
import {
  ALUMNO_ID_TEST,
  CategoriaProductoMother,
  PrediccionGastoPresupuestoMother,
  PresupuestoMother,
} from './presupuesto.mother';
import { PresupuestoPage } from './presupuesto.page';
import { PresupuestoService } from './services/presupuesto.service';

@Component({ selector: 'app-regla-categoria-item', template: '', standalone: true })
class ReglaCategoriaItemStub {
  @Input() regla!: ReglaCategoria;
  @Output() porcentajeChange = new EventEmitter<{ reglaId: string; porcentaje: number }>();
  @Output() eliminar = new EventEmitter<string>();
}

describe('Presupuesto Integration', () => {
  let fixture: ComponentFixture<PresupuestoPage>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioPresupuesto: jasmine.SpyObj<PresupuestoService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['asegurarCargados', 'getAlumnoById']);
    servicioAlumnos.asegurarCargados.and.resolveTo([]);
    servicioAlumnos.getAlumnoById.and.returnValue(
      AlumnoMother.crear({ id: ALUMNO_ID_TEST, nombre: 'Mateo', apellido: 'López', grado: '5to A' }),
    );

    servicioPresupuesto = jasmine.createSpyObj('PresupuestoService', [
      'getPresupuesto',
      'getCategoriasDisponibles',
      'cargarPrediccion',
      'guardar',
    ]);
    servicioPresupuesto.getCategoriasDisponibles.and.resolveTo(CategoriaProductoMother.crearVarias());
    servicioPresupuesto.getPresupuesto.and.resolveTo(undefined);
    servicioPresupuesto.cargarPrediccion.and.resolveTo(PrediccionGastoPresupuestoMother.crear());
    servicioPresupuesto.guardar.and.resolveTo(PresupuestoMother.crear({ id: 'pres-nuevo' }));

    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);

    const servicioUsuario = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual']);
    servicioUsuario.getUsuarioActual.and.returnValue({
      nombre: 'Tutor Integration',
    } as ReturnType<UsuarioService['getUsuarioActual']>);

    await TestBed.configureTestingModule({
      imports: [PresupuestoPage],
      providers: [
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: PresupuestoService, useValue: servicioPresupuesto },
        { provide: ToastService, useValue: servicioToast },
        { provide: Router, useValue: router },
        { provide: UsuarioService, useValue: servicioUsuario },
        {
          provide: AlumnoContextoService,
          useValue: { alumnoId: signal(ALUMNO_ID_TEST).asReadonly() },
        },
      ],
    })
      .overrideComponent(PresupuestoPage, {
        remove: { imports: [ReglaCategoriaItemComponent] },
        add: { imports: [ReglaCategoriaItemStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PresupuestoPage);
  });

  it('dado el alumnoId en el contexto, cuando se monta la page, deberia pedirle al service categorias, presupuesto y prediccion', async () => {
    await whenMontoYEspero();

    expect(servicioAlumnos.asegurarCargados).toHaveBeenCalled();
    expect(servicioPresupuesto.getCategoriasDisponibles).toHaveBeenCalled();
    expect(servicioPresupuesto.getPresupuesto).toHaveBeenCalledWith(ALUMNO_ID_TEST);
    expect(servicioPresupuesto.cargarPrediccion).toHaveBeenCalledWith(ALUMNO_ID_TEST, 'MENSUAL');
  });

  it('dado un presupuesto del back con reglas, cuando se monta, deberia propagarlas al item stub via input', async () => {
    servicioPresupuesto.getPresupuesto.and.resolveTo(PresupuestoMother.crearConMultiplesReglas());

    await whenMontoYEspero();

    const items = fixture.debugElement.queryAll(
      (d) => d.componentInstance instanceof ReglaCategoriaItemStub,
    );
    expect(items.length).toBe(2);
    expect(items[0].componentInstance.regla.categoriaId).toBe('cat-bebidas');
  });

  it('dado un presupuesto valido, cuando se guarda, deberia mostrar toast de success', async () => {
    await whenMontoYEspero();

    await fixture.componentInstance['presenter'].guardar();

    expect(servicioPresupuesto.guardar).toHaveBeenCalled();
    expect(servicioToast.mostrar).toHaveBeenCalledWith('Presupuesto guardado.', 'success');
  });

  async function whenMontoYEspero(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});
