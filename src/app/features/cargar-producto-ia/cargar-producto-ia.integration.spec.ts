import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { DialogService } from '../../shared/services/dialog.service';
import { Categoria } from '../inventario/models/categoria.interface';
import { ProductoService } from '../inventario/services/producto.service';
import {
  CategoriaMother,
  RespuestaProductoIaMother,
  SolicitudGuardarProductoMother,
} from './cargar-producto-ia.mother';
import { CargarProductoIaPageComponent } from './cargar-producto-ia-page/cargar-producto-ia-page.component';
import { CapturaCamara } from './components/captura-camara/captura-camara';
import { EscanerLoader } from './components/escaner-loader/escaner-loader';
import { ProductoIaForm } from './components/producto-ia-form/producto-ia-form';
import { RespuestaProductoIa } from './models/producto-ia-response.interface';
import { SolicitudGuardarProducto } from './models/guardar-producto-request.interface';
import { IaVisionService } from './services/ia-vision-service/ia-vision-service';

@Component({
  selector: 'app-camera-capture',
  template: '',
  standalone: true,
})
class CapturaCamaraStub {
  @Input() isScanning = false;
  @Output() photoTaken = new EventEmitter<File>();
}

@Component({
  selector: 'app-scanner-loader',
  template: '',
  standalone: true,
})
class EscanerLoaderStub {
  @Input() isScanning = false;
}

@Component({
  selector: 'app-ai-product-form',
  template: '',
  standalone: true,
})
class ProductoIaFormStub {
  @Input() prefillData: RespuestaProductoIa | null = null;
  @Input() categories: Categoria[] = [];
  @Input() isSaving = false;
  @Input() buffetId = '';
  @Output() save = new EventEmitter<SolicitudGuardarProducto>();
}

describe('CargarProductoIa Integration', () => {
  const BUFFET_ID = 'buffet-integration';

  let fixture: ComponentFixture<CargarProductoIaPageComponent>;
  let servicioIa: jasmine.SpyObj<IaVisionService>;
  let servicioProductos: jasmine.SpyObj<ProductoService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioDialog: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    servicioIa = jasmine.createSpyObj('IaVisionService', ['analyzeImage', 'saveProduct']);
    servicioIa.analyzeImage.and.returnValue(of(RespuestaProductoIaMother.crear()));
    servicioIa.saveProduct.and.returnValue(of({}));

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
    })
      .overrideComponent(CargarProductoIaPageComponent, {
        remove: { imports: [CapturaCamara, EscanerLoader, ProductoIaForm] },
        add: { imports: [CapturaCamaraStub, EscanerLoaderStub, ProductoIaFormStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CargarProductoIaPageComponent);
  });

  it('dado que se monta la page, deberia pedir categorias, propagarlas al form y setear el buffetId del perfil', () => {
    whenMonto();

    const form = obtenerForm();
    expect(form.categories.length).toBe(1);
    expect(form.buffetId).toBe(BUFFET_ID);
  });

  it('dado que la camara emite una foto, cuando llega la respuesta de la IA, deberia propagar los datos como prefillData del form', () => {
    whenMonto();

    whenLaCamaraEmiteFoto(crearImagen());

    const form = obtenerForm();
    expect(servicioIa.analyzeImage).toHaveBeenCalled();
    expect(form.prefillData?.nombre).toBe('Galletas de arroz integral');
  });

  it('dado que el analisis IA falla, cuando la camara emite una foto, deberia abrir el dialog de error', fakeAsync(() => {
    spyOn(console, 'error');
    servicioIa.analyzeImage.and.returnValue(throwError(() => new Error('IA boom')));
    whenMonto();

    whenLaCamaraEmiteFoto(crearImagen());
    tick();

    expect(servicioDialog.alert).toHaveBeenCalledWith(
      'Hubo un error al procesar la imagen.',
      'Error de Análisis',
    );
  }));

  it('dado que el form emite save, deberia llamar al service pisando el buffetId con el del perfil', () => {
    whenMonto();
    const request = SolicitudGuardarProductoMother.crear({ buffetId: 'buffet-anterior' });

    whenElFormEmiteSave(request);

    expect(servicioIa.saveProduct).toHaveBeenCalledWith({ ...request, buffetId: BUFFET_ID });
  });

  it('dado el guardado ok, deberia mostrar el feedback de exito y limpiar el prefillData del form', () => {
    whenMonto();
    whenLaCamaraEmiteFoto(crearImagen());

    whenElFormEmiteSave(SolicitudGuardarProductoMother.crear());

    thenElFeedbackDeExitoEsVisible();
    expect(obtenerForm().prefillData).toBeNull();
  });

  it('dado el guardado falla, deberia mostrar el feedback de error', () => {
    spyOn(console, 'error');
    servicioIa.saveProduct.and.returnValue(throwError(() => new Error('save boom')));
    whenMonto();

    whenElFormEmiteSave(SolicitudGuardarProductoMother.crear());

    const error = queryTexto('.carga-producto__feedback--error');
    expect(error).toContain('Hubo un error al guardar el producto');
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function obtenerForm(): ProductoIaFormStub {
    return fixture.debugElement.query((d) => d.componentInstance instanceof ProductoIaFormStub)
      ?.componentInstance as ProductoIaFormStub;
  }

  function obtenerCamara(): CapturaCamaraStub {
    return fixture.debugElement.query((d) => d.componentInstance instanceof CapturaCamaraStub)
      ?.componentInstance as CapturaCamaraStub;
  }

  function whenLaCamaraEmiteFoto(foto: File): void {
    obtenerCamara().photoTaken.emit(foto);
    fixture.detectChanges();
  }

  function whenElFormEmiteSave(request: SolicitudGuardarProducto): void {
    obtenerForm().save.emit(request);
    fixture.detectChanges();
  }

  function queryTexto(selector: string): string {
    const el = (fixture.nativeElement as HTMLElement).querySelector(selector);
    return el?.textContent?.trim() ?? '';
  }

  function thenElFeedbackDeExitoEsVisible(): void {
    const exito = queryTexto('.carga-producto__feedback--success');
    expect(exito).toContain('¡Producto guardado exitosamente!');
  }

  function crearImagen(): File {
    return new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
  }
});
