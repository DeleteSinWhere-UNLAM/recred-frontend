import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { ProductoService } from '../../inventario/services/producto.service';
import {
  CategoriaMother,
  RespuestaProductoIaMother,
  SolicitudGuardarProductoMother,
} from '../cargar-producto-ia.mother';
import { IaVisionService } from '../services/ia-vision-service/ia-vision-service';
import { CargarProductoIaPageComponent } from './cargar-producto-ia-page.component';

describe('CargarProductoIaPageComponent', () => {
  const BUFFET_ID = 'buffet-test-123';

  let component: CargarProductoIaPageComponent;
  let fixture: ComponentFixture<CargarProductoIaPageComponent>;
  let servicioIa: jasmine.SpyObj<IaVisionService>;
  let servicioProductos: jasmine.SpyObj<ProductoService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioDialog: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    servicioIa = jasmine.createSpyObj('IaVisionService', ['analyzeImage', 'saveProduct']);
    servicioIa.analyzeImage.and.returnValue(of(RespuestaProductoIaMother.crear()));

    servicioProductos = jasmine.createSpyObj('ProductoService', ['getCategories']);
    servicioProductos.getCategories.and.returnValue(of([CategoriaMother.crear()]));

    servicioPerfil = jasmine.createSpyObj('PerfilService', ['obtenerBuffetId']);
    servicioPerfil.obtenerBuffetId.and.returnValue(BUFFET_ID);

    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['setHomeUrl']);

    servicioDialog = jasmine.createSpyObj('DialogService', ['alert', 'confirm']);
    servicioDialog.alert.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [CargarProductoIaPageComponent],
      providers: [
        { provide: IaVisionService, useValue: servicioIa },
        { provide: ProductoService, useValue: servicioProductos },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: DialogService, useValue: servicioDialog },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CargarProductoIaPageComponent);
    component = fixture.componentInstance;
  });

  describe('Estado inicial', () => {
    it('dado el componente recien creado, deberia arrancar sin loading, sin saving y sin datos escaneados', () => {
      expect(component.isLoading).toBeFalse();
      expect(component.isSaving).toBeFalse();
      expect(component.scannedProductData).toBeNull();
      expect(component.saveSuccess).toBeFalse();
      expect(component.saveError).toBeNull();
    });

    it('dado el componente al construirse, deberia setear /kiosquero como home del usuario', () => {
      expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
    });
  });

  describe('ngOnInit', () => {
    it('dado un perfil con buffet, cuando inicializa, deberia cargar categorias y actualizar el buffetId', () => {
      whenMonto();

      expect(servicioProductos.getCategories).toHaveBeenCalled();
      expect(component.categories.length).toBe(1);
      expect(component.buffetId).toBe(BUFFET_ID);
    });

    it('dado que getCategories falla, cuando inicializa, deberia loggear el error sin romper', () => {
      spyOn(console, 'error');
      servicioProductos.getCategories.and.returnValue(throwError(() => new Error('categorias boom')));

      whenMonto();

      expect(console.error).toHaveBeenCalled();
      expect(component.categories).toEqual([]);
    });
  });

  describe('handlePhoto', () => {
    it('dado una foto valida, cuando la manejo, deberia enviarla al service y guardar los datos escaneados', () => {
      whenMonto();
      const foto = crearImagen();

      component.handlePhoto(foto);

      expect(servicioIa.analyzeImage).toHaveBeenCalledWith(foto);
      expect(component.scannedProductData?.nombre).toBe('Galletas de arroz integral');
      expect(component.isLoading).toBeFalse();
    });

    it('dado que el analisis falla, cuando manejo la foto, deberia mostrar el dialog de error', fakeAsync(() => {
      spyOn(console, 'error');
      whenMonto();
      servicioIa.analyzeImage.and.returnValue(throwError(() => new Error('IA boom')));

      component.handlePhoto(crearImagen());
      tick();

      expect(component.isLoading).toBeFalse();
      expect(servicioDialog.alert).toHaveBeenCalledWith(
        'Hubo un error al procesar la imagen.',
        'Error de Análisis',
      );
    }));
  });

  describe('saveProduct', () => {
    it('dado un request y un buffet en el perfil, cuando guardo, deberia mandar el buffet actual del perfil (no el del request)', () => {
      whenMonto();
      servicioIa.saveProduct.and.returnValue(of({}));
      const request = SolicitudGuardarProductoMother.crear({ buffetId: 'buffet-viejo' });

      component.saveProduct(request);

      expect(servicioIa.saveProduct).toHaveBeenCalledWith({ ...request, buffetId: BUFFET_ID });
      expect(component.saveSuccess).toBeTrue();
      expect(component.scannedProductData).toBeNull();
    });

    it('dado que el perfil no tiene buffet, cuando guardo, deberia setear saveError y no llamar al service', () => {
      servicioPerfil.obtenerBuffetId.and.returnValue(null);
      whenMonto();

      component.saveProduct(SolicitudGuardarProductoMother.crear());

      expect(servicioIa.saveProduct).not.toHaveBeenCalled();
      expect(component.saveError).toBe('No se encontro un buffet asociado a tu perfil.');
      expect(component.saveSuccess).toBeFalse();
    });

    it('dado que el service falla, cuando guardo, deberia setear el mensaje de error', () => {
      spyOn(console, 'error');
      whenMonto();
      servicioIa.saveProduct.and.returnValue(throwError(() => new Error('save boom')));

      component.saveProduct(SolicitudGuardarProductoMother.crear());

      expect(component.saveError).toBe('Hubo un error al guardar el producto. Intenta nuevamente.');
      expect(component.isSaving).toBeFalse();
    });
  });

  describe('volver', () => {
    it('dado el componente montado, cuando llamo volver, deberia navegar a /kiosquero', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigateByUrl');

      component.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function crearImagen(): File {
    return new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
  }
});
