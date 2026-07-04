import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AlumnoMother } from '../../../../data-access/services/alumno.mother';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CarritosFavoritosService } from '../../../carritos-favoritos/services/carritos-favoritos.service';
import { CarritoFavoritoResponse } from '../../../carritos-favoritos/models/carritos-favoritos.model';
import { GuardarFavoritoModalComponent } from './guardar-favorito-modal.component';

interface Perfil {
  id: string;
  nombre: string;
  plan?: string;
}

describe('GuardarFavoritoModalComponent', () => {
  let component: GuardarFavoritoModalComponent;
  let fixture: ComponentFixture<GuardarFavoritoModalComponent>;
  let alumnosService: {
    alumnos: ReturnType<typeof signal>;
    asegurarCargados: jasmine.Spy;
  };
  let carritosFavoritosService: jasmine.SpyObj<CarritosFavoritosService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let perfilSignal: ReturnType<typeof signal<Perfil | null>>;
  let esVistaAlumnoSignal: ReturnType<typeof signal<boolean>>;

  async function setup(perfil: Perfil | null = { id: 'p-1', nombre: 'Tutor', plan: 'PREMIUM' }): Promise<void> {
    esVistaAlumnoSignal = signal(false);
    perfilSignal = signal<Perfil | null>(perfil);

    alumnosService = {
      alumnos: signal([AlumnoMother.crearHijoDelTutor()]),
      asegurarCargados: jasmine.createSpy('asegurarCargados').and.resolveTo([]),
    };

    carritosFavoritosService = jasmine.createSpyObj<CarritosFavoritosService>('CarritosFavoritosService', [
      'saveCarritoFavorito',
      'getCarritosFavoritos',
    ]);
    carritosFavoritosService.saveCarritoFavorito.and.returnValue(of({} as CarritoFavoritoResponse));
    carritosFavoritosService.getCarritosFavoritos.and.returnValue(of([]));

    toastService = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);

    await TestBed.configureTestingModule({
      imports: [GuardarFavoritoModalComponent],
      providers: [
        { provide: AlumnosService, useValue: alumnosService },
        { provide: CarritosFavoritosService, useValue: carritosFavoritosService },
        { provide: ToastService, useValue: toastService },
        { provide: UsuarioService, useValue: { esVistaAlumno: esVistaAlumnoSignal } },
        { provide: PerfilService, useValue: { perfil: perfilSignal } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GuardarFavoritoModalComponent);
    component = fixture.componentInstance;
    component.initialNombre = '';
    component.initialAlumnoId = '';
    component.items = [];
  }

  describe('ngOnInit', () => {
    it('cuando se monta, deberia asegurar que los alumnos esten cargados e inicializar nombre/alumnoId', async () => {
      await setup();
      component.initialNombre = 'Desayuno';
      component.initialAlumnoId = 'alumno-1';

      fixture.detectChanges();

      expect(alumnosService.asegurarCargados).toHaveBeenCalled();
      expect(component.nombre).toBe('Desayuno');
      expect(component.alumnoId).toBe('alumno-1');
    });

    it('dado plan GRATUITO y no hay cartId, cuando se monta y tengo 3 carritos, deberia marcar limitReached', async () => {
      await setup({ id: 'p-1', nombre: 'Tutor', plan: 'GRATUITO' });
      carritosFavoritosService.getCarritosFavoritos.and.returnValue(
        of([{}, {}, {}] as CarritoFavoritoResponse[]),
      );

      fixture.detectChanges();

      expect(component.limitReached).toBeTrue();
    });

    it('dado plan PREMIUM, cuando se monta, no deberia pedir carritos favoritos para validar limite', async () => {
      await setup({ id: 'p-1', nombre: 'Tutor', plan: 'PREMIUM' });

      fixture.detectChanges();

      expect(carritosFavoritosService.getCarritosFavoritos).not.toHaveBeenCalled();
    });

    it('dado un cartId (editando), cuando se monta, no deberia validar limite ni marcar limitReached', async () => {
      await setup({ id: 'p-1', nombre: 'Tutor', plan: 'GRATUITO' });
      component.cartId = 'existing-cart';
      carritosFavoritosService.getCarritosFavoritos.and.returnValue(
        of([{}, {}, {}] as CarritoFavoritoResponse[]),
      );

      fixture.detectChanges();

      expect(carritosFavoritosService.getCarritosFavoritos).not.toHaveBeenCalled();
      expect(component.limitReached).toBeFalse();
    });
  });

  describe('total', () => {
    it('dados items, cuando pido el total, deberia sumar price * quantity', async () => {
      await setup();
      component.items = [
        { productId: 'p1', productName: 'A', price: 100, quantity: 2 },
        { productId: 'p2', productName: 'B', price: 50, quantity: 3 },
      ];

      expect(component.total).toBe(350);
    });
  });

  describe('onSave', () => {
    beforeEach(async () => {
      await setup();
      fixture.detectChanges();
      component.nombre = 'Mi carrito';
      component.alumnoId = 'alumno-1';
      component.items = [{ productId: 'p1', productName: 'A', price: 100, quantity: 2 }];
    });

    it('dado un nombre vacio, cuando guardo, deberia mostrar toast de error y no llamar al service', () => {
      component.nombre = '   ';

      component.onSave();

      expect(toastService.mostrar).toHaveBeenCalledWith(
        'Por favor, ingresá un nombre para el carrito',
        'error',
      );
      expect(carritosFavoritosService.saveCarritoFavorito).not.toHaveBeenCalled();
    });

    it('dado sin alumnoId, cuando guardo, deberia mostrar toast de error', () => {
      component.alumnoId = '';

      component.onSave();

      expect(toastService.mostrar).toHaveBeenCalledWith('Por favor, seleccioná un hijo', 'error');
      expect(carritosFavoritosService.saveCarritoFavorito).not.toHaveBeenCalled();
    });

    it('dado sin items, cuando guardo, deberia mostrar toast de error', () => {
      component.items = [];

      component.onSave();

      expect(toastService.mostrar).toHaveBeenCalledWith(
        'No hay productos en el carrito para guardar',
        'error',
      );
    });

    it('dado un carrito nuevo, cuando guardo con exito, deberia mostrar toast + emitir saveSuccess + closeModal', () => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closeModal, 'emit');

      component.onSave();

      expect(carritosFavoritosService.saveCarritoFavorito).toHaveBeenCalledWith(
        jasmine.objectContaining({
          id: null,
          nombre: 'Mi carrito',
          alumnoId: 'alumno-1',
          items: [{ productId: 'p1', quantity: 2 }],
        }),
      );
      expect(toastService.mostrar).toHaveBeenCalledWith(
        'Carrito guardado como favorito con éxito',
        'success',
      );
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closeModal.emit).toHaveBeenCalled();
    });

    it('dado un cartId (editando), cuando guardo con exito, deberia mostrar toast de actualizado', () => {
      component.cartId = 'existing';

      component.onSave();

      expect(toastService.mostrar).toHaveBeenCalledWith(
        'Carrito favorito actualizado con éxito',
        'success',
      );
    });

    it('dado que el service falla, cuando guardo, deberia mostrar toast de error y dejar isSaving en false', () => {
      spyOn(console, 'error');
      carritosFavoritosService.saveCarritoFavorito.and.returnValue(
        throwError(() => new Error('boom')),
      );

      component.onSave();

      expect(toastService.mostrar).toHaveBeenCalledWith(
        'Hubo un error al guardar el carrito favorito',
        'error',
      );
      expect(component.isSaving).toBeFalse();
    });
  });

  describe('onClose', () => {
    it('cuando hago click en cerrar, deberia emitir closeModal', async () => {
      await setup();
      fixture.detectChanges();
      spyOn(component.closeModal, 'emit');

      component.onClose();

      expect(component.closeModal.emit).toHaveBeenCalled();
    });
  });
});
