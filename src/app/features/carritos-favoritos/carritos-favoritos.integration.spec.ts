import { Component, EventEmitter, Input, Output, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Alumno } from '../../data-access/models/alumno.model';
import { Perfil } from '../../data-access/models/perfil.model';
import { AlumnoMother, PerfilMother } from '../../data-access/services/alumno.mother';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { CarritoService } from '../compra/services/carrito.service';
import { GuardarFavoritoModalComponent } from '../compra/components/guardar-favorito-modal/guardar-favorito-modal.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CarritoFavoritoResponseMother } from './carritos-favoritos.mother';
import { CarritosFavoritosPage } from './carritos-favoritos.page';
import { CarritosFavoritosService } from './services/carritos-favoritos.service';

@Component({
  selector: 'app-navbar',
  template: '',
  standalone: true,
})
class NavbarStub {
  @Input() userName = '';
}

@Component({
  selector: 'app-guardar-favorito-modal',
  template: '',
  standalone: true,
})
class GuardarFavoritoModalStub {
  @Input() cartId: string | null = null;
  @Input() initialNombre = '';
  @Input() initialAlumnoId = '';
  @Input() items: unknown[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
}

describe('CarritosFavoritos Integration', () => {
  let fixture: ComponentFixture<CarritosFavoritosPage>;
  let servicioCarritos: jasmine.SpyObj<CarritosFavoritosService>;
  let servicioCarritoActual: jasmine.SpyObj<CarritoService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioDialog: jasmine.SpyObj<DialogService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let perfilSignal: WritableSignal<Perfil | null>;

  beforeEach(async () => {
    servicioCarritos = jasmine.createSpyObj('CarritosFavoritosService', [
      'getCarritosFavoritos',
      'saveCarritoFavorito',
      'deleteCarritoFavorito',
    ]);
    servicioCarritos.getCarritosFavoritos.and.returnValue(
      of([
        CarritoFavoritoResponseMother.crearParaAlumno('alumno-1', {
          id: 'c-1',
          nombre: 'Merienda',
        }),
        CarritoFavoritoResponseMother.crearParaAlumno('alumno-2', {
          id: 'c-2',
          nombre: 'Recreo largo',
          alumnoNombre: 'Sofia',
          alumnoApellido: 'Garcia',
        }),
      ]),
    );
    servicioCarritos.deleteCarritoFavorito.and.returnValue(of(void 0));

    servicioCarritoActual = jasmine.createSpyObj('CarritoService', ['agregar']);
    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    servicioDialog = jasmine.createSpyObj('DialogService', ['confirm', 'alert']);
    servicioDialog.confirm.and.resolveTo(true);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['setHomeUrl']);
    (servicioUsuario as unknown as { nombreNavbar: WritableSignal<string> }).nombreNavbar =
      signal('Tutor Test');

    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['asegurarCargados', 'getAlumnoById']);
    servicioAlumnos.asegurarCargados.and.resolveTo([]);
    servicioAlumnos.getAlumnoById.and.callFake((id: string): Alumno | undefined => {
      if (id === 'alumno-1') return AlumnoMother.crear({ id, urlFotoPerfil: 'https://foto.com/1.png' });
      if (id === 'alumno-2') return AlumnoMother.crear({ id, urlFotoPerfil: null });
      return undefined;
    });

    perfilSignal = signal<Perfil | null>(PerfilMother.crear({ plan: 'GRATIS', rol: 'PADRE' }));

    await TestBed.configureTestingModule({
      imports: [CarritosFavoritosPage],
      providers: [
        { provide: CarritosFavoritosService, useValue: servicioCarritos },
        { provide: CarritoService, useValue: servicioCarritoActual },
        { provide: ToastService, useValue: servicioToast },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: DialogService, useValue: servicioDialog },
        {
          provide: PerfilService,
          useValue: {
            perfil: perfilSignal.asReadonly(),
            esPlanGratuito: signal(true).asReadonly(),
          },
        },
        { provide: AlumnosService, useValue: servicioAlumnos },
        provideRouter([]),
      ],
    })
      .overrideComponent(CarritosFavoritosPage, {
        remove: { imports: [NavbarComponent, GuardarFavoritoModalComponent] },
        add: { imports: [NavbarStub, GuardarFavoritoModalStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CarritosFavoritosPage);
  });

  it('dado carritos de dos alumnos, cuando se monta la page, deberia renderizar una card por alumno', async () => {
    await whenMonto();

    const cards = queryAll('.grupo-hijo-card');
    expect(cards.length).toBe(2);
  });

  it('dado la lista vacia, cuando se monta la page, deberia mostrar el estado vacio', async () => {
    servicioCarritos.getCarritosFavoritos.and.returnValue(of([]));

    await whenMonto();

    expect(queryUno('.carritos-page__vacio')).toBeTruthy();
    expect(queryUno('.grupo-hijo-card')).toBeFalsy();
  });

  it('dado el plan gratuito y 3+ carritos, cuando se monta, deberia mostrar el aviso de limite', async () => {
    servicioCarritos.getCarritosFavoritos.and.returnValue(
      of([
        CarritoFavoritoResponseMother.crearParaAlumno('alumno-1', { id: 'c-1' }),
        CarritoFavoritoResponseMother.crearParaAlumno('alumno-1', { id: 'c-2' }),
        CarritoFavoritoResponseMother.crearParaAlumno('alumno-1', { id: 'c-3' }),
      ]),
    );

    await whenMonto();

    expect(queryTexto('.dashboard-limit-alert')).toContain('Límite de 5 carritos favoritos');
  });

  it('dado un carrito, cuando toco eliminar y confirmo, deberia llamar al service y recargar', async () => {
    await whenMonto();

    (queryUno('.carrito-card__btn-icon--danger') as HTMLButtonElement).click();
    await Promise.resolve();
    await Promise.resolve();

    expect(servicioCarritos.deleteCarritoFavorito).toHaveBeenCalledWith('c-1');
    expect(servicioCarritos.getCarritosFavoritos).toHaveBeenCalledTimes(2);
  });

  it('dado un carrito, cuando toco Cargar, deberia agregar cada item al CarritoService actual', async () => {
    await whenMonto();

    (queryUno('.carrito-card__btn-cargar') as HTMLButtonElement).click();

    expect(servicioCarritoActual.agregar).toHaveBeenCalled();
    expect(servicioToast.mostrar).toHaveBeenCalledWith(
      jasmine.stringMatching(/Merienda/),
      'success',
    );
  });

  it('dado que el service falla en la carga inicial, deberia mostrar el toast de error', async () => {
    spyOn(console, 'error');
    servicioCarritos.getCarritosFavoritos.and.returnValue(
      throwError(() => new Error('boom')),
    );

    await whenMonto();

    expect(servicioToast.mostrar).toHaveBeenCalledWith(
      'Error al cargar los carritos favoritos',
      'error',
    );
  });

  async function whenMonto(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function queryUno(selector: string): Element | null {
    return (fixture.nativeElement as HTMLElement).querySelector(selector);
  }

  function queryAll(selector: string): NodeListOf<Element> {
    return (fixture.nativeElement as HTMLElement).querySelectorAll(selector);
  }

  function queryTexto(selector: string): string {
    return queryUno(selector)?.textContent?.trim() ?? '';
  }
});
