import { Component, EventEmitter, Input, Output, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Alumno } from '../../data-access/models/alumno.model';
import { Perfil } from '../../data-access/models/perfil.model';
import { AlumnoMother, PerfilMother } from '../../data-access/services/alumno.mother';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ToastService } from '../../shared/services/toast.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CarritoService } from '../compra/services/carrito.service';
import { GuardarFavoritoModalComponent } from '../compra/components/guardar-favorito-modal/guardar-favorito-modal.component';
import { CarritoFavoritoResponseMother } from './carritos-favoritos.mother';
import { CarritosFavoritosPage } from './carritos-favoritos.page';
import { CarritosFavoritosService } from './services/carritos-favoritos.service';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

@Component({ selector: 'app-guardar-favorito-modal', template: '', standalone: true })
class GuardarFavoritoModalStub {
  @Input() cartId: string | null = null;
  @Input() initialNombre = '';
  @Input() initialAlumnoId = '';
  @Input() items: unknown[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();
}

describe('CarritosFavoritosPage', () => {
  let component: CarritosFavoritosPage;
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
    servicioCarritos.getCarritosFavoritos.and.returnValue(of([]));
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
    const perfilServiceFake = {
      perfil: perfilSignal.asReadonly(),
      esPlanGratuito: signal(true).asReadonly(),
    };

    await TestBed.configureTestingModule({
      imports: [CarritosFavoritosPage],
      providers: [
        { provide: CarritosFavoritosService, useValue: servicioCarritos },
        { provide: CarritoService, useValue: servicioCarritoActual },
        { provide: ToastService, useValue: servicioToast },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: DialogService, useValue: servicioDialog },
        { provide: PerfilService, useValue: perfilServiceFake },
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
    component = fixture.componentInstance;
  });

  describe('Estado inicial', () => {
    it('dado la page recien creada, deberia setear /tutor como home del usuario', () => {
      expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/tutor');
    });

    it('dado la page recien creada, no deberia tener carritos ni grupos ni modal abierta', () => {
      expect(component.carritosFavoritos).toEqual([]);
      expect(component.gruposHijos()).toEqual([]);
      expect(component.mostrarModalEditar).toBeFalse();
    });
  });

  describe('ngOnInit', () => {
    it('dado varios carritos de un mismo alumno, cuando inicializo, deberia agruparlos por hijo con la foto de perfil del AlumnosService', async () => {
      servicioCarritos.getCarritosFavoritos.and.returnValue(
        of([
          CarritoFavoritoResponseMother.crearParaAlumno('alumno-1', { id: 'c-1', nombre: 'Merienda' }),
          CarritoFavoritoResponseMother.crearParaAlumno('alumno-1', { id: 'c-2', nombre: 'Recreo largo' }),
          CarritoFavoritoResponseMother.crearParaAlumno('alumno-2', {
            id: 'c-3',
            nombre: 'Solo agua',
            alumnoNombre: 'Sofia',
          }),
        ]),
      );

      whenMonto();
      await servicioAlumnos.asegurarCargados();
      await Promise.resolve();

      const grupos = component.gruposHijos();
      expect(grupos.length).toBe(2);
      expect(grupos[0].carritos.length).toBe(2);
      expect(grupos[0].urlFotoPerfil).toBe('https://foto.com/1.png');
      expect(grupos[1].urlFotoPerfil).toBeNull();
    });

    it('dado que asegurarCargados falla, cuando inicializo, deberia cargar los carritos igual', async () => {
      spyOn(console, 'error');
      servicioAlumnos.asegurarCargados.and.rejectWith(new Error('boom'));
      servicioCarritos.getCarritosFavoritos.and.returnValue(
        of([CarritoFavoritoResponseMother.crear()]),
      );

      whenMonto();
      await Promise.resolve();
      await Promise.resolve();

      expect(servicioCarritos.getCarritosFavoritos).toHaveBeenCalled();
    });

    it('dado que getCarritosFavoritos falla, cuando cargo, deberia mostrar toast de error', async () => {
      spyOn(console, 'error');
      servicioCarritos.getCarritosFavoritos.and.returnValue(
        throwError(() => new Error('boom')),
      );

      whenMonto();
      await servicioAlumnos.asegurarCargados();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al cargar los carritos favoritos',
        'error',
      );
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('toggleGrupoHijo', () => {
    it('dado un grupo expandido, cuando hago toggle, deberia colapsarlo', () => {
      component.toggleGrupoHijo('alumno-1');

      expect(component.isGrupoHijoExpanded('alumno-1')).toBeFalse();
    });

    it('dado un grupo colapsado, cuando hago toggle, deberia expandirlo', () => {
      component.toggleGrupoHijo('alumno-1');
      component.toggleGrupoHijo('alumno-1');

      expect(component.isGrupoHijoExpanded('alumno-1')).toBeTrue();
    });

    it('dado todos los grupos colapsados, todosHijosColapsados deberia ser true', async () => {
      servicioCarritos.getCarritosFavoritos.and.returnValue(
        of([
          CarritoFavoritoResponseMother.crearParaAlumno('alumno-1'),
          CarritoFavoritoResponseMother.crearParaAlumno('alumno-2', { id: 'c-2' }),
        ]),
      );
      whenMonto();
      await servicioAlumnos.asegurarCargados();

      component.toggleGrupoHijo('alumno-1');
      component.toggleGrupoHijo('alumno-2');

      expect(component.todosHijosColapsados()).toBeTrue();
    });
  });

  describe('getInitials', () => {
    it('dado un nombre con dos palabras, deberia devolver las iniciales en mayuscula', () => {
      expect(component.getInitials('Juan Perez')).toBe('JP');
    });

    it('dado un nombre con una sola palabra, deberia devolver los dos primeros caracteres en mayuscula', () => {
      expect(component.getInitials('Sofia')).toBe('SO');
    });

    it('dado un nombre vacio, deberia devolver string vacio', () => {
      expect(component.getInitials('')).toBe('');
    });
  });

  describe('cargarAlCarrito', () => {
    it('dado un carrito con varios items, cuando cargo, deberia agregar cada uno al CarritoService con su cantidad', () => {
      const carrito = CarritoFavoritoResponseMother.crear({
        alumnoId: 'alumno-1',
        items: [
          { productId: 'p-1', productName: 'Alfajor', unitPrice: 500, quantity: 2 },
          { productId: 'p-2', productName: 'Agua', unitPrice: 300, quantity: 1 },
        ],
      });

      component.cargarAlCarrito(carrito);

      expect(servicioCarritoActual.agregar).toHaveBeenCalledTimes(2);
      const primerArg = servicioCarritoActual.agregar.calls.first().args;
      expect(primerArg[0].id).toBe('p-1');
      expect(primerArg[0].nombre).toBe('Alfajor');
      expect(primerArg[1]).toBe('alumno-1');
      expect(primerArg[2]).toBe(2);
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        jasmine.stringMatching(/Mi carrito preferido/),
        'success',
      );
    });
  });

  describe('eliminarCarrito', () => {
    it('dado un id, cuando el usuario confirma, deberia eliminar y recargar', async () => {
      await component.eliminarCarrito('c-1');

      expect(servicioCarritos.deleteCarritoFavorito).toHaveBeenCalledWith('c-1');
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Carrito favorito eliminado', 'success');
    });

    it('dado un id, cuando el usuario cancela el confirm, no deberia eliminar', async () => {
      servicioDialog.confirm.and.resolveTo(false);

      await component.eliminarCarrito('c-1');

      expect(servicioCarritos.deleteCarritoFavorito).not.toHaveBeenCalled();
    });

    it('dado que el service falla, cuando elimino, deberia mostrar toast de error', async () => {
      spyOn(console, 'error');
      servicioCarritos.deleteCarritoFavorito.and.returnValue(
        throwError(() => new Error('boom')),
      );

      await component.eliminarCarrito('c-1');

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'Error al eliminar el carrito favorito',
        'error',
      );
    });
  });

  describe('abrir / cerrar modal', () => {
    it('dado un carrito, cuando abro el modal, deberia cargar los datos iniciales y mapear items', () => {
      const carrito = CarritoFavoritoResponseMother.crear({
        id: 'c-1',
        nombre: 'Merienda',
        alumnoId: 'alumno-1',
      });

      component.abrirEditarModal(carrito);

      expect(component.mostrarModalEditar).toBeTrue();
      expect(component.editarCartId).toBe('c-1');
      expect(component.editarInitialNombre).toBe('Merienda');
      expect(component.editarInitialAlumnoId).toBe('alumno-1');
      expect(component.editarItems.length).toBe(1);
      expect(component.editarItems[0].price).toBe(500);
    });

    it('dado el modal abierto, cuando lo cierro, deberia limpiar los datos', () => {
      component.abrirEditarModal(CarritoFavoritoResponseMother.crear());

      component.cerrarEditarModal();

      expect(component.mostrarModalEditar).toBeFalse();
      expect(component.editarCartId).toBeNull();
      expect(component.editarInitialNombre).toBe('');
      expect(component.editarItems).toEqual([]);
    });
  });

  describe('volver', () => {
    it('dado el componente montado, cuando llamo volver, deberia navegar a /tutor', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigateByUrl');

      component.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });
  });

  describe('formatearPrecio', () => {
    it('dado un numero, deberia formatearlo con el separador de miles y el simbolo argentino', () => {
      const formatted = component.formatearPrecio(1500);
      expect(formatted).toContain('1');
      expect(formatted).toContain('500');
      expect(formatted).toMatch(/\$/);
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
