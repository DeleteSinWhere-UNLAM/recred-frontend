import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlumnoMother } from '../../../../data-access/services/alumno.mother';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { ItemCarritoMother } from '../../compra.mother';
import { ItemCarrito } from '../../models/carrito.model';
import { CarritoItemComponent } from '../carrito-item/carrito-item.component';
import { OrdenAlumnoCardComponent } from './orden-alumno-card.component';

@Component({ selector: 'app-carrito-item', template: '', standalone: true })
class CarritoItemStub {
  @Input() item!: ItemCarrito;
  @Output() sumar = new EventEmitter<string>();
  @Output() restar = new EventEmitter<string>();
  @Output() eliminar = new EventEmitter<string>();
}

describe('OrdenAlumnoCardComponent', () => {
  let component: OrdenAlumnoCardComponent;
  let fixture: ComponentFixture<OrdenAlumnoCardComponent>;
  let esVistaAlumnoSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    esVistaAlumnoSignal = signal(false);

    await TestBed.configureTestingModule({
      imports: [OrdenAlumnoCardComponent],
      providers: [
        { provide: UsuarioService, useValue: { esVistaAlumno: esVistaAlumnoSignal.asReadonly() } },
      ],
    })
      .overrideComponent(OrdenAlumnoCardComponent, {
        remove: { imports: [CarritoItemComponent] },
        add: { imports: [CarritoItemStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(OrdenAlumnoCardComponent);
    component = fixture.componentInstance;
    component.alumno = AlumnoMother.crear({ nombre: 'Juan', apellido: 'Perez', saldo: 5000 });
    component.items = [ItemCarritoMother.crear({ cantidad: 2 })];
    component.fecha = '2026-07-15';
    component.recreo = 'PRIMER_RECREO';
  });

  describe('render de identidad', () => {
    it('dado vista tutor, cuando renderizo, deberia mostrar solo el nombre + inicial', () => {
      whenMonto();

      expect(component.nombreCompleto()).toBe('Juan');
      expect(component.iniciales()).toBe('J');
    });

    it('dado vista alumno, cuando renderizo, deberia mostrar nombre completo + iniciales de ambos', () => {
      esVistaAlumnoSignal.set(true);

      whenMonto();

      expect(component.nombreCompleto()).toBe('Juan Perez');
      expect(component.iniciales()).toBe('JP');
    });

    it('dado un alumno con foto, cuando renderizo, deberia mostrar la img', () => {
      component.alumno = AlumnoMother.crear({
        nombre: 'Juan',
        apellido: 'Perez',
        urlFotoPerfil: 'foto.jpg',
      });

      whenMonto();

      expect((fixture.nativeElement as HTMLElement).querySelector('img.orden-alumno__avatar-img')).not.toBeNull();
    });
  });

  describe('subtotal y saldo', () => {
    it('dado items con cantidad 2 y precio 500, cuando pido el subtotal, deberia devolver 1000', () => {
      whenMonto();

      expect(component.subtotal()).toBe(1000);
      expect(component.subtotalFormateado()).toMatch(/\$\s?1\.000/);
    });

    it('dado que el saldo es menor al subtotal, saldoInsuficiente deberia ser true y mostrar alerta', () => {
      component.alumno = AlumnoMother.crear({ nombre: 'Juan', apellido: 'Perez', saldo: 100 });
      component.items = [ItemCarritoMother.crear({ cantidad: 5 })];

      whenMonto();

      expect(component.saldoInsuficiente()).toBeTrue();
      expect(textoRenderizado()).toContain('El saldo no alcanza');
    });

    it('dado motivoBloqueoPresupuesto, cuando renderizo, deberia mostrarlo como alerta', () => {
      component.motivoBloqueoPresupuesto = 'Supera el presupuesto de comidas';

      whenMonto();

      expect(textoRenderizado()).toContain('Supera el presupuesto de comidas');
    });
  });

  describe('fecha y recreo', () => {
    it('dado una fecha yyyy-mm-dd, cuando la formateo, deberia devolver dd/mm/yyyy', () => {
      component.fecha = '2026-07-15';

      whenMonto();

      expect(component.fechaFormateada()).toBe('15/07/2026');
    });

    it('dado sin fecha, cuando la formateo, deberia devolver "—"', () => {
      component.fecha = '';

      whenMonto();

      expect(component.fechaFormateada()).toBe('—');
    });

    it('dado un recreo conocido, cuando pido el label, deberia devolver el texto humano', () => {
      component.recreo = 'MEDIODIA';

      whenMonto();

      expect(component.recreoLabel()).toBe('Mediodía');
    });
  });

  describe('modo edicion vs solo lectura', () => {
    it('dado modoSoloLectura=false, cuando renderizo, deberia mostrar inputs de fecha y select de recreo', () => {
      whenMonto();

      expect((fixture.nativeElement as HTMLElement).querySelector('input[type="date"]')).not.toBeNull();
      expect((fixture.nativeElement as HTMLElement).querySelector('select')).not.toBeNull();
    });

    it('dado modoSoloLectura=true, cuando renderizo, deberia mostrar el boton "Editar retiro"', () => {
      component.modoSoloLectura = true;

      whenMonto();

      expect((fixture.nativeElement as HTMLElement).querySelector('.orden-alumno__retiro-editar')).not.toBeNull();
    });
  });

  describe('eventos', () => {
    it('cuando cambio la fecha en el input, deberia emitir fechaCambia con el nuevo valor', () => {
      spyOn(component.fechaCambia, 'emit');
      whenMonto();
      const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type="date"]')!;
      input.value = '2026-07-20';

      input.dispatchEvent(new Event('change'));

      expect(component.fechaCambia.emit).toHaveBeenCalledWith('2026-07-20');
    });

    it('cuando cambio el recreo en el select, deberia emitir recreoCambia', () => {
      spyOn(component.recreoCambia, 'emit');
      component.recreosDisponibles = [
        { recreo: 'PRIMER_RECREO', descripcion: '1er Recreo', bloqueado: false },
        { recreo: 'SEGUNDO_RECREO', descripcion: '2do Recreo', bloqueado: false },
      ];
      whenMonto();
      const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>('select')!;
      select.value = 'SEGUNDO_RECREO';

      select.dispatchEvent(new Event('change'));

      expect(component.recreoCambia.emit).toHaveBeenCalledWith('SEGUNDO_RECREO');
    });

    it('cuando hago click en el checkbox de seleccion, deberia emitir toggleSeleccion', () => {
      spyOn(component.toggleSeleccion, 'emit');
      whenMonto();

      (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type="checkbox"]')?.click();

      expect(component.toggleSeleccion.emit).toHaveBeenCalled();
    });

    it('cuando hago click en el boton favorito, deberia emitir guardarFavorito', () => {
      spyOn(component.guardarFavorito, 'emit');
      whenMonto();

      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.orden-alumno__favorito-btn')?.click();

      expect(component.guardarFavorito.emit).toHaveBeenCalled();
    });

    it('dado favoritoDeshabilitado=true, el boton favorito deberia estar deshabilitado', () => {
      component.favoritoDeshabilitado = true;

      whenMonto();

      const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.orden-alumno__favorito-btn')!;
      expect(btn.disabled).toBeTrue();
    });

    it('dado modoSoloLectura=true, cuando hago click en editar retiro, deberia emitir editarRetiro', () => {
      spyOn(component.editarRetiro, 'emit');
      component.modoSoloLectura = true;

      whenMonto();
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.orden-alumno__retiro-editar')?.click();

      expect(component.editarRetiro.emit).toHaveBeenCalled();
    });
  });

  describe('branches sin alumno', () => {
    it('dado un alumno sin urlFotoPerfil, urlFotoPerfil deberia devolver null', () => {
      component.alumno = AlumnoMother.crear({ nombre: 'X', apellido: 'Y', urlFotoPerfil: null });
      whenMonto();

      expect(component.urlFotoPerfil()).toBeNull();
    });

    it('dado un alumno vacio (sin nombre/apellido), iniciales deberia devolver string vacio', () => {
      component.alumno = AlumnoMother.crear({ nombre: '', apellido: '' });
      esVistaAlumnoSignal.set(true);
      whenMonto();

      expect(component.iniciales()).toBe('');
    });

    it('dado un alumno con solo primer caracter del apellido undefined, iniciales deberia manejarlo', () => {
      component.alumno = AlumnoMother.crear({ nombre: 'A', apellido: '' });
      esVistaAlumnoSignal.set(true);
      whenMonto();

      expect(component.iniciales()).toBe('A');
    });
  });

  describe('recreoLabel fallback', () => {
    it('dado un recreo con valor desconocido, recreoLabel deberia devolverlo tal cual', () => {
      component.recreo = 'DESCONOCIDO' as never;
      whenMonto();

      expect(component.recreoLabel()).toBe('DESCONOCIDO');
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function textoRenderizado(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
});
